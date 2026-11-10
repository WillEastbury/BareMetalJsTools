param(
  [int]$HttpPort = 0,
  [int]$Port = 0,
  [int]$TimeoutSec = 60
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if ($HttpPort -le 0) {
  $tcp = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
  $tcp.Start()
  $HttpPort = ([Net.IPEndPoint]$tcp.LocalEndpoint).Port
  $tcp.Stop()
}
if ($Port -le 0) { $Port = Get-Random -Minimum 10000 -Maximum 15000 }
$edgeCandidates = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$edge = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw 'Microsoft Edge not found' }
$profile = Join-Path $env:TEMP ("bm-apps-{0}-{1}" -f $PID, [guid]::NewGuid().ToString('n'))
$server = $null
$browser = $null
$ws = $null
$cts = New-Object System.Threading.CancellationTokenSource
$script:recvTask = $null
$script:recvBuf = $null
$script:cdpId = 0

function Send-Cdp($socket, $id, $method, $params) {
  $json = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Compress -Depth 10
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $segment = New-Object System.ArraySegment[byte] (,$bytes)
  $socket.SendAsync($segment, [Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
}

function Receive-Cdp($socket, $timeoutMs) {
  $builder = New-Object Text.StringBuilder
  $done = $false
  while (-not $done) {
    if ($null -eq $script:recvTask -or $script:recvTask.IsCompleted) {
      $script:recvBuf = New-Object byte[] 1048576
      $segment = New-Object System.ArraySegment[byte] (,$script:recvBuf)
      $script:recvTask = $socket.ReceiveAsync($segment, $cts.Token)
    }
    if (-not $script:recvTask.Wait($timeoutMs)) { return $null }
    $result = $script:recvTask.Result
    $script:recvTask = $null
    [void]$builder.Append([Text.Encoding]::UTF8.GetString($script:recvBuf, 0, $result.Count))
    $done = $result.EndOfMessage
  }
  return $builder.ToString()
}

function Invoke-CdpEval($expression, $awaitPromise = $false, $timeoutMs = 10000) {
  $script:cdpId++
  $id = $script:cdpId
  Send-Cdp $ws $id 'Runtime.evaluate' @{
    expression = $expression
    returnByValue = $true
    awaitPromise = $awaitPromise
  }
  $deadline = (Get-Date).AddMilliseconds($timeoutMs)
  while ((Get-Date) -lt $deadline) {
    $raw = Receive-Cdp $ws 1000
    if (-not $raw) { continue }
    try { $message = $raw | ConvertFrom-Json } catch { continue }
    if ($message.method -eq 'Runtime.exceptionThrown') {
      $details = $message.params.exceptionDetails
      $description = if ($details.exception.description) { $details.exception.description } else { $details.text }
      throw ('Browser exception: ' + $description + ' at ' + $details.url + ':' + $details.lineNumber)
    }
    if ($message.id -ne $id) { continue }
    if ($message.error) { throw ('CDP evaluation failed: ' + $message.error.message) }
    if ($message.result.exceptionDetails) {
      $details = $message.result.exceptionDetails
      throw ('Browser evaluation failed: ' + $details.text + ' at ' + $details.url + ':' + $details.lineNumber)
    }
    return $message.result.result.value
  }
  throw "Timed out evaluating browser expression: $expression"
}

function Wait-App($appName, $file) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  $expectedPath = "/docs/apps/$file"
  $lastPageState = $null
  while ((Get-Date) -lt $deadline) {
    $value = Invoke-CdpEval 'JSON.stringify({path:location.pathname,app:window.__BM_APP__||null})' $false 5000
    if ($value) {
      $pageState = $value | ConvertFrom-Json
      $lastPageState = $pageState
      if ($pageState.path -eq $expectedPath -and $pageState.app) {
        if ($pageState.app.ready) { return $pageState.app }
        if ($pageState.app.error) { throw "$appName failed to initialize: $($pageState.app.error)" }
      }
    }
    Start-Sleep -Milliseconds 250
  }
  throw "$appName did not initialize before timeout: $(ConvertTo-Json $lastPageState -Compress -Depth 4)"
}

function Navigate-App($file, $name) {
  $script:cdpId++
  Send-Cdp $ws $script:cdpId 'Page.navigate' @{ url = "http://127.0.0.1:$HttpPort/docs/apps/$file" }
  [void](Wait-App $name $file)
}

function Assert-Json($json, $condition, $message) {
  $result = $json | ConvertFrom-Json
  if (-not $condition.Invoke($result)) { throw "$message : $json" }
  return $result
}

try {
  $server = Start-Process -FilePath 'python' -PassThru -ArgumentList @(
    '-m','http.server',[string]$HttpPort,'--directory',$root
  )
  $until = (Get-Date).AddSeconds(15)
  $served = $false
  while ((Get-Date) -lt $until) {
    try { Invoke-RestMethod "http://127.0.0.1:$HttpPort/docs/apps/index.html" | Out-Null; $served = $true; break }
    catch { Start-Sleep -Milliseconds 150 }
  }
  if (-not $served) { throw "Local app server failed on port $HttpPort" }

  $browser = Start-Process -FilePath $edge -PassThru -ArgumentList @(
    '--headless=new','--enable-webgl','--enable-unsafe-swiftshader','--no-first-run',
    "--remote-debugging-port=$Port","--user-data-dir=$profile",
    "http://127.0.0.1:$HttpPort/docs/apps/index.html"
  )
  $targets = $null
  $until = (Get-Date).AddSeconds(20)
  while ((Get-Date) -lt $until) {
    try {
      $targets = @(Invoke-RestMethod "http://127.0.0.1:$Port/json/list")
      if ($targets.Count -eq 1 -and $targets[0] -is [array]) { $targets = @($targets[0]) }
      break
    } catch { Start-Sleep -Milliseconds 200 }
  }
  $page = $targets | Where-Object { $_.type -eq 'page' -and ([string]$_.url).Contains('/docs/apps/index.html') } | Select-Object -Last 1
  if (-not $page) { throw 'Could not find interactive apps page in Edge' }
  $ws = New-Object Net.WebSockets.ClientWebSocket
  $ws.ConnectAsync([Uri]$page.webSocketDebuggerUrl, $cts.Token).Wait()
  $script:cdpId++
  Send-Cdp $ws $script:cdpId 'Runtime.enable' @{}
  $script:cdpId++
  Send-Cdp $ws $script:cdpId 'Page.enable' @{}

  $index = Invoke-CdpEval "(function(){var search=document.getElementById('app-search');var category=document.getElementById('app-category');var cards=Array.from(document.querySelectorAll('main article'));search.value='ERP';search.dispatchEvent(new Event('input',{bubbles:true}));var erp=cards.filter(function(card){return !card.hidden}).length;var erpFlags=cards.map(function(card){return card.hidden});search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));category.value='documents';category.dispatchEvent(new Event('change',{bubbles:true}));var documents=cards.filter(function(card){return !card.hidden}).length;category.value='media';category.dispatchEvent(new Event('change',{bubbles:true}));var media=cards.filter(function(card){return !card.hidden}).length;return JSON.stringify({links:document.querySelectorAll('main article a.bt').length,apps:cards.length,erp:erp,documents:documents,media:media,erpFlags:erpFlags,category:category.value,term:search.value,labels:cards.map(function(card){return card.dataset.search})})})()"
  $indexReport = Assert-Json $index { param($r) $r.apps -eq 9 -and $r.links -eq 9 -and $r.erp -eq 1 -and $r.documents -eq 1 -and $r.media -eq 1 } 'Expected searchable nine-app directory'
  Write-Output ("APPS_INDEX_OK apps={0}" -f $indexReport.apps)

  Navigate-App 'codes.html' 'Codes and Forms'
  $codes = Invoke-CdpEval "(function(){var country=document.querySelector('[name=country]');country.value='US';country.dispatchEvent(new Event('change',{bubbles:true}));return JSON.stringify({ready:window.__BM_APP__.ready,countries:window.__BM_APP__.countries,valid:window.__BM_APP__.validate().valid,selected:document.querySelector('[m-text=countryLabel]').textContent,conversion:document.getElementById('conversion-result').textContent})})()"
  $codesReport = Assert-Json $codes { param($r) $r.countries -gt 200 -and $r.valid -and $r.selected -match 'United States' -and $r.conversion -match 'mi' } 'Codes/form binding check failed'
  Write-Output ("CODES_FORMS_OK countries={0}" -f $codesReport.countries)

  Navigate-App 'chat.html' 'PubSub Chat'
  $chat = Invoke-CdpEval "JSON.stringify((function(){var app=window.__BM_APP__;app.switchChannel('engineering');app.sendMessage('browser-check-message');return {ready:app.ready,visible:document.getElementById('chat-log').textContent.indexOf('browser-check-message')>=0,channel:document.getElementById('channel-title').textContent}})())"
  [void](Assert-Json $chat { param($r) $r.visible -and $r.channel -eq '# engineering' } 'PubSub chat check failed')
  Write-Output 'PUBSUB_CHAT_OK'

  Navigate-App 'erp.html' 'ERP'
  $erp = Invoke-CdpEval "(function(){var search=document.getElementById('order-search');var filter=document.getElementById('status-filter');search.value='Northstar';search.dispatchEvent(new Event('input',{bubbles:true}));var searchRows=document.querySelectorAll('#order-rows > tr:not([hidden])').length;search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));filter.value='approved';filter.dispatchEvent(new Event('change',{bubbles:true}));var approvedRows=document.querySelectorAll('#order-rows > tr:not([hidden])').length;filter.value='all';filter.dispatchEvent(new Event('change',{bubbles:true}));return JSON.stringify({ready:window.__BM_APP__.ready,storage:window.__BM_APP__.storage,orders:window.__BM_APP__.getOrders().length,nested:document.querySelectorAll('.nested-lines table tbody tr').length,chart:!!document.querySelector('#spend-chart svg'),pivot:!!document.querySelector('#pivot-control .bm-pivot-table'),graph:!!document.querySelector('#document-graph svg'),searchRows:searchRows,approvedRows:approvedRows,open:document.getElementById('kpi-open').textContent,approval:document.getElementById('kpi-approval').textContent})})()"
  $erpReport = Assert-Json $erp { param($r) $r.storage -eq 'IndexedDB' -and $r.orders -ge 4 -and $r.nested -ge 1 -and $r.chart -and $r.pivot -and $r.graph -and $r.searchRows -eq 1 -and $r.approvedRows -eq 1 -and $r.open -eq '4' -and $r.approval -eq '2' } 'ERP dashboard, filters, or rendering check failed'
  $treeDocument = Invoke-CdpEval "(function(){var button=document.querySelector('[data-document-action=document][data-document-order=PO-1042]');if(!button)return JSON.stringify({found:false});button.click();var html=document.getElementById('document-html-preview').srcdoc;return JSON.stringify({found:true,open:document.getElementById('document-dialog').open,title:document.getElementById('document-dialog-title').textContent,preview:html.indexOf('Four-channel mixer')>=0&&html.indexOf('Northstar Audio')>=0,print:typeof window.__BM_APP__.printDocument==='function'&&!!document.getElementById('print-document')})})()"
  [void](Assert-Json $treeDocument { param($r) $r.found -and $r.open -and $r.title -eq 'Purchase Order PO-1042' -and $r.preview -and $r.print } 'ERP document tree did not render or print the selected purchase order')
  $orderPdf = Invoke-CdpEval "(async function(){var result=await window.__BM_APP__.generateDocumentPdf();var header=await result.blob.slice(0,8).text();return JSON.stringify({type:result.blob.type,header:header,pages:result.pages,words:result.searchableWords,download:!document.getElementById('download-document-pdf').hidden,preview:document.getElementById('document-pdf-preview').src.indexOf('blob:')===0})})()" $true 45000
  [void](Assert-Json $orderPdf { param($r) $r.type -eq 'application/pdf' -and $r.header -eq '%PDF-1.4' -and $r.pages -ge 1 -and $r.words -gt 0 -and $r.download -and $r.preview } 'ERP purchase order PDF generation failed')
  $treeInvoice = Invoke-CdpEval "(function(){var button=document.querySelector('[data-document-action=invoice][data-document-order=PO-1042]');if(!button)return JSON.stringify({found:false});button.click();var html=document.getElementById('document-html-preview').srcdoc;return JSON.stringify({found:true,open:document.getElementById('document-dialog').open,title:document.getElementById('document-dialog-title').textContent,preview:html.indexOf('INV-1042')>=0&&html.indexOf('Four-channel mixer')>=0&&html.indexOf('Northstar Audio')>=0})})()"
  [void](Assert-Json $treeInvoice { param($r) $r.found -and $r.open -and $r.title -eq 'Invoice INV-1042' -and $r.preview } 'ERP document tree did not render the linked invoice')
  $invoicePdf = Invoke-CdpEval "(async function(){var result=await window.__BM_APP__.generateDocumentPdf();var header=await result.blob.slice(0,8).text();return JSON.stringify({type:result.blob.type,header:header,pages:result.pages,words:result.searchableWords,download:!document.getElementById('download-document-pdf').hidden})})()" $true 45000
  [void](Assert-Json $invoicePdf { param($r) $r.type -eq 'application/pdf' -and $r.header -eq '%PDF-1.4' -and $r.pages -ge 1 -and $r.words -gt 0 -and $r.download } 'ERP linked invoice PDF generation failed')
  Write-Output ("ERP_DOCUMENTS_OK order-pdf={0}p invoice-pdf={1}p" -f (($orderPdf | ConvertFrom-Json).pages), (($invoicePdf | ConvertFrom-Json).pages))
  $edit = Invoke-CdpEval "(function(){window.__BM_APP__.openFirst();return JSON.stringify({open:document.getElementById('order-dialog').open,id:document.querySelector('#order-form [name=id]').value})})()"
  [void](Assert-Json $edit { param($r) $r.open -and $r.id } 'ERP row-bound edit modal failed')
  $save = Invoke-CdpEval "(async function(){var form=document.getElementById('order-form');var input=form.elements.customer;input.value='Browser Test Supplier';input.dispatchEvent(new Event('input',{bubbles:true}));form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));for(var i=0;i<30;i++){await new Promise(function(resolve){setTimeout(resolve,50)});var rows=window.__BM_APP__.getOrders();if(rows[0].customer==='Browser Test Supplier'){var verifyDb=await BareMetal.IDB.open('bm-erp-demo-v1');var stored=await verifyDb.get('orders',rows[0].id);verifyDb.close();return JSON.stringify({saved:true,closed:!document.getElementById('order-dialog').open,persisted:stored&&stored.customer});}}return JSON.stringify({saved:false,customer:window.__BM_APP__.getOrders()[0].customer});})()" $true 10000
  [void](Assert-Json $save { param($r) $r.saved -and $r.closed -and $r.persisted -eq 'Browser Test Supplier' } 'ERP bound form IndexedDB save failed')
  Write-Output ("ERP_OK orders={0} nested-lines={1} storage={2}" -f $erpReport.orders,$erpReport.nested,$erpReport.storage)

  Navigate-App 'editor.html' 'Markdown and HTML Editor'
  $editor = Invoke-CdpEval "(function(){var app=window.__BM_APP__;var frame=document.getElementById('html-preview');var mode=document.getElementById('editor-mode');var safe=app.safeHtmlDocument('<script>window.pwned=1</script><img src=https://example.invalid/x onerror=alert(1)><p>safe</p>');mode.value='html';mode.dispatchEvent(new Event('change',{bubbles:true}));return JSON.stringify({ready:app.ready,markdown:app.getMarkdownPreview().indexOf('Field notes')>=0,sandbox:frame.hasAttribute('sandbox'),safe:safe.indexOf('<script')<0&&safe.indexOf('img')<0&&safe.indexOf('onerror')<0,mode:app.getMode(),htmlPreview:frame.srcdoc.indexOf('HTML preview')>=0})})()"
  [void](Assert-Json $editor { param($r) $r.markdown -and $r.sandbox -and $r.safe -and $r.mode -eq 'html' -and $r.htmlPreview } 'Editor preview safety check failed')
  Write-Output 'EDITOR_OK markdown-and-sandboxed-html'

  Navigate-App 'document-renderer.html' 'HTML Document Renderer'
  $documentPdf = Invoke-CdpEval "(async function(){var result=await window.__BM_APP__.render();var header=await result.blob.slice(0,8).text();return JSON.stringify({ready:window.__BM_APP__.ready,type:result.blob.type,header:header,pages:result.pages,words:result.searchableWords,download:!document.getElementById('download-pdf').hidden})})()" $true 45000
  $documentReport = Assert-Json $documentPdf { param($r) $r.ready -and $r.type -eq 'application/pdf' -and $r.header -eq '%PDF-1.4' -and $r.pages -ge 2 -and $r.words -gt 0 -and $r.download } 'HTML document renderer failed to generate a searchable multipage PDF'
  Write-Output ("DOCUMENT_PDF_OK pages={0} searchable-words={1}" -f $documentReport.pages,$documentReport.words)

  Navigate-App 'workflow.html' 'Workflow Editor'
  $workflow = Invoke-CdpEval "(async function(){var app=window.__BM_APP__;var count=app.getSteps().length;document.querySelector('[data-add-step=SET]').click();var added=app.getSteps().length===count+1;document.querySelector('#step-list li:last-child button[aria-label=""Delete step""]').click();var removed=app.getSteps().length===count;document.getElementById('save-workflow').click();await new Promise(function(resolve){setTimeout(resolve,100)});var db=await BareMetal.IDB.open('bm-workflow-demo-v1');var stored=await db.get('workflows','purchase-approval');db.close();var context=await app.run();return JSON.stringify({ready:app.ready,steps:app.getSteps().length,decision:context.decision,added:added,removed:removed,persisted:stored&&stored.steps.length===count})})()" $true 15000
  $workflowReport = Assert-Json $workflow { param($r) $r.steps -ge 6 -and $r.decision -eq 'manager-review' -and $r.added -and $r.removed -and $r.persisted } 'Workflow editing, persistence, or execution check failed'
  Write-Output ("WORKFLOW_OK steps={0} decision={1}" -f $workflowReport.steps,$workflowReport.decision)

  Navigate-App 'auth-tokens.html' 'Token and RBAC'
  $auth = Invoke-CdpEval "(async function(){var app=window.__BM_APP__;await app.setRole('admin');return JSON.stringify({ready:app.ready,role:BareMetal.RBAC.hasRole('admin'),allowed:BareMetal.RBAC.can('users:manage'),decoded:!!BareMetal.Tokens.decode(app.getToken()).payload.sub})})()" $true 15000
  [void](Assert-Json $auth { param($r) $r.role -and $r.allowed -and $r.decoded } 'Token/RBAC check failed')
  Write-Output 'AUTH_RBAC_OK'

  Navigate-App 'xr-world.html' '3DXR World'
  $xr = Invoke-CdpEval "(function(){var app=window.__BM_APP__;app.setSpeed(1.7);return JSON.stringify({ready:app.ready,renderer:app.rendererAvailable,speed:Number(app.getModel().speed),canvas:!!document.querySelector('#world-canvas'),status:document.getElementById('world-status').textContent})})()"
  $xrReport = Assert-Json $xr { param($r) $r.speed -eq 1.7 -and $r.canvas -and $r.renderer } '3DXR model binding or renderer check failed'
  Write-Output ("XR_MODEL_OK rendererAvailable={0}" -f $xrReport.renderer)

  Navigate-App 'dj-mixer.html' 'DJ MIDI Mixer'
  $dj = Invoke-CdpEval "(async function(){var app=window.__BM_APP__;app.setCrossfader(0.25);var loaded=await app.loadFiles([new File([new Uint8Array([0,1,2,3])],'check.mp3',{type:'audio/mpeg'})]);return JSON.stringify({ready:app.ready,channels:app.channels,slider:Number(document.getElementById('crossfader').value),mp3:document.getElementById('track-files').accept,loaded:loaded,local:document.getElementById('audio-0').src.indexOf('blob:')===0,title:document.getElementById('track-name-0').textContent})})()" $true 10000
  $djReport = Assert-Json $dj { param($r) $r.channels -eq 4 -and $r.slider -eq 63 -and $r.mp3 -match 'mp3' -and $r.loaded -eq 1 -and $r.local -and $r.title -match 'check\.mp3' } 'DJ mixer local MP3 loading check failed'
  Write-Output ("DJ_MIXER_OK channels={0} local-file={1}" -f $djReport.channels,$djReport.local)
} finally {
  if ($ws) { try { $ws.Abort() } catch {} }
  if ($browser -and -not $browser.HasExited) { try { Stop-Process -Id $browser.Id -Force } catch {} }
  if ($server -and -not $server.HasExited) { try { Stop-Process -Id $server.Id -Force } catch {} }
  if (Test-Path $profile) { Remove-Item -Recurse -Force $profile -ErrorAction SilentlyContinue }
}
