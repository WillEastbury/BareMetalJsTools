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
if ($Port -le 0) { $Port = Get-Random -Minimum 9330 -Maximum 9930 }
$edgeCandidates = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$edge = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw 'Microsoft Edge not found' }
$profile = Join-Path $env:TEMP ("bm-showcase-{0}-{1}" -f $PID, [guid]::NewGuid().ToString('n'))
$server = $null
$browser = $null
$ws = $null
$cts = New-Object System.Threading.CancellationTokenSource
$script:recvTask = $null
$script:recvBuf = $null

function Send-Cdp($socket, $id, $method, $params) {
  $json = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Compress -Depth 8
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

try {
  $server = Start-Process -FilePath 'python' -PassThru -ArgumentList @(
    '-m','http.server',[string]$HttpPort,'--directory',$root
  )
  $until = (Get-Date).AddSeconds(15)
  $served = $false
  while ((Get-Date) -lt $until) {
    try { Invoke-RestMethod "http://127.0.0.1:$HttpPort/docs/module-library.json" | Out-Null; $served = $true; break }
    catch { Start-Sleep -Milliseconds 150 }
  }
  if (-not $served) { throw "Local showcase server failed on port $HttpPort" }
  $browser = Start-Process -FilePath $edge -PassThru -ArgumentList @(
    '--headless=new','--disable-gpu','--allow-file-access-from-files','--no-first-run',
    "--remote-debugging-port=$Port","--user-data-dir=$profile",
    "http://127.0.0.1:$HttpPort/docs/index.html"
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
  $pages = @($targets | Where-Object { $_.type -eq 'page' -and ([string]$_.url).Contains('/docs/index.html') })
  $page = $pages | Select-Object -Last 1
  if (-not $page) { throw 'Could not find showcase page in Edge' }
  $ws = New-Object Net.WebSockets.ClientWebSocket
  $wsUrl = [string](@($page.webSocketDebuggerUrl)[0])
  $ws.ConnectAsync([Uri]$wsUrl, $cts.Token).Wait()
  Send-Cdp $ws 1 'Runtime.enable' @{}
  $expression = "JSON.stringify((function(){function lum(color){var rgb=color.match(/\d+/g).slice(0,3).map(function(x){var v=Number(x)/255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]}function ratio(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}var s=window.__BM_SHOWCASE__;var code=document.querySelector('#bind-demo pre');var cs=code?getComputedStyle(code):null;return {status:s||null,cards:document.querySelectorAll('#catalog-grid article').length,rows:document.querySelectorAll('#relation-demo tbody tr').length,chart:!!document.querySelector('#chart-live svg'),codeColor:cs&&cs.color,codeBackground:cs&&cs.backgroundColor,codeContrast:cs&&ratio(cs.color,cs.backgroundColor),styles:Array.from(document.styleSheets).map(function(x){return x.href||'inline'}),title:document.title,url:location.href}})())"
  $id = 2
  Send-Cdp $ws $id 'Runtime.evaluate' @{ expression = $expression; returnByValue = $true }
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  $report = $null
  while ((Get-Date) -lt $deadline) {
    $raw = Receive-Cdp $ws 1500
    if (-not $raw) {
      $id++
      Send-Cdp $ws $id 'Runtime.evaluate' @{ expression = $expression; returnByValue = $true }
      continue
    }
    try { $message = $raw | ConvertFrom-Json } catch { continue }
    if ($message.method -eq 'Runtime.exceptionThrown') {
      $details = $message.params.exceptionDetails
      $description = if ($details.exception.description) { $details.exception.description } else { $details.text }
      $frames = @($details.stackTrace.callFrames | ForEach-Object { $_.url + ':' + $_.lineNumber })
      throw ('Browser exception: ' + $description + ' source=' + $details.url + ':' + $details.lineNumber + ':' + $details.columnNumber + ' ' + ($frames -join ', '))
    }
    if ($message.id -eq $id) {
      $value = $message.result.result.value
      if ($value -and $value -ne 'null') {
        $candidate = $value | ConvertFrom-Json
        if (($candidate.status -and $candidate.status.ready) -or ($candidate.status -and $candidate.status.error)) {
          $report = $candidate
          break
        }
      }
      $id++
      Send-Cdp $ws $id 'Runtime.evaluate' @{ expression = $expression; returnByValue = $true }
    }
  }
  if (-not $report) {
    if ($candidate) { throw ('Showcase did not finish: ' + ($candidate | ConvertTo-Json -Compress -Depth 6)) }
    throw 'Showcase did not finish loading the module catalog'
  }
  if ($report.status.error) { throw $report.status.error }
  if ($report.cards -lt 100) { throw "Expected at least 100 module cards, got $($report.cards)" }
  if ($report.rows -lt 1) { throw 'Nested data-table sample did not render rows' }
  if (-not $report.chart) { throw 'BareMetal.Charts example did not render SVG' }
  if ($report.codeBackground -eq 'rgba(0, 0, 0, 0)' -or $report.codeContrast -lt 4.5) { throw "Code sample contrast failed: $($report.codeColor)/$($report.codeBackground) ($($report.codeContrast):1)" }
  if ($report.styles -match 'inline') { throw 'Found inline stylesheet; expected BareMetalStyles only' }
  Write-Output ("SHOWCASE_OK modules={0} demos={1} rows={2}" -f $report.cards,$report.status.examples,$report.rows)

  Send-Cdp $ws 50 'Page.enable' @{}
  Send-Cdp $ws 51 'Page.navigate' @{ url = "http://127.0.0.1:$HttpPort/docs/API-Library.html" }
  $apiExpression = "JSON.stringify((function(){function lum(color){var rgb=color.match(/\d+/g).slice(0,3).map(function(x){var v=Number(x)/255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]}function ratio(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}var card=document.querySelector('#modules article');var code=card&&card.querySelector('pre');var css=code?getComputedStyle(code):null;return {title:document.title,cards:document.querySelectorAll('#modules article').length,color:css&&css.color,background:css&&css.backgroundColor,contrast:css&&ratio(css.color,css.backgroundColor),styles:Array.from(document.styleSheets).map(function(x){return x.href||'inline'})}})())"
  $id = 52
  Send-Cdp $ws $id 'Runtime.evaluate' @{ expression = $apiExpression; returnByValue = $true }
  $apiReport = $null
  $deadline = (Get-Date).AddSeconds(30)
  while ((Get-Date) -lt $deadline) {
    $raw = Receive-Cdp $ws 1500
    if (-not $raw) {
      $id++
      Send-Cdp $ws $id 'Runtime.evaluate' @{ expression = $apiExpression; returnByValue = $true }
      continue
    }
    try { $message = $raw | ConvertFrom-Json } catch { continue }
    if ($message.method -eq 'Runtime.exceptionThrown') {
      $details = $message.params.exceptionDetails
      throw ('API page browser exception: ' + $details.text + ' at ' + $details.url + ':' + $details.lineNumber)
    }
    if ($message.id -eq $id) {
      $value = $message.result.result.value
      if ($value -and $value -ne 'null') {
        $candidate = $value | ConvertFrom-Json
        if ($candidate.cards -gt 0) { $apiReport = $candidate; break }
      }
      $id++
      Send-Cdp $ws $id 'Runtime.evaluate' @{ expression = $apiExpression; returnByValue = $true }
    }
  }
  if (-not $apiReport) { throw 'API library page did not render module cards' }
  if ($apiReport.background -eq 'rgba(0, 0, 0, 0)' -or $apiReport.contrast -lt 4.5) { throw "API sample text contrast failed: $($apiReport.color)/$($apiReport.background) ($($apiReport.contrast):1)" }
  if ($apiReport.styles -match 'inline') { throw 'API library uses inline styles instead of BareMetalStyles' }
  Write-Output ("API_LIBRARY_OK cards={0} sample-contrast={1}:1" -f $apiReport.cards,$apiReport.contrast)
} finally {
  if ($ws) { try { $ws.Abort() } catch {} }
  if ($browser -and -not $browser.HasExited) { try { Stop-Process -Id $browser.Id -Force } catch {} }
  if ($server -and -not $server.HasExited) { try { Stop-Process -Id $server.Id -Force } catch {} }
  if (Test-Path $profile) { Remove-Item -Recurse -Force $profile -ErrorAction SilentlyContinue }
}
