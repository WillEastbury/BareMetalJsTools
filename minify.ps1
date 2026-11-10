param(
  [string[]]$Path = @(),
  [switch]$All,
  [switch]$Check,
  [switch]$Write,
  [int]$Port = 0,
  [int]$TimeoutSec = 60,
  [int]$StartupTimeoutSec = 20
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$srcRoot = Join-Path $here "src"
$hostHtml = Join-Path $here "minify-host.html"
$minifierJs = Join-Path $srcRoot "BareMetal.Minifier.js"

if (-not (Test-Path $hostHtml)) { throw "missing minify-host.html" }
if (-not (Test-Path $minifierJs)) { throw "missing src/BareMetal.Minifier.js" }

# Default (no -Check/-Write): dry-run minify, fail only on unsupported/errors.
# -Check: exact equality against checked-in *.min.* artefacts.
# -Write: refresh artefacts.
if ($Check -and $Write) { throw "use either -Check or -Write, not both" }
$mode = if ($Write) { 'write' } elseif ($Check) { 'check' } else { 'dry-run' }
if (-not $All -and $Path.Count -eq 0) { $All = $true }

function Get-OutPath([string]$inPath) {
  if ($inPath -match '\.min\.(js|css)$') { throw "refusing to minify already-min path: $inPath" }
  if ($inPath -match '\.js$') { return ($inPath -replace '\.js$', '.min.js') }
  if ($inPath -match '\.css$') { return ($inPath -replace '\.css$', '.min.css') }
  throw "unsupported extension: $inPath"
}

function Get-Kind([string]$inPath) {
  if ($inPath -match '\.css$') { return 'css' }
  if ($inPath -match '\.js$') { return 'js' }
  throw "unsupported extension: $inPath"
}

function Resolve-Targets {
  $list = New-Object System.Collections.Generic.List[string]
  if ($All) {
    Get-ChildItem -Path $srcRoot -Recurse -File | Where-Object {
      $_.Name -notmatch '\.min\.(js|css)$' -and
      ($_.Extension -eq '.js' -or $_.Extension -eq '.css') -and
      $_.FullName -notmatch '[\\/]vendor[\\/]' -and
      $_.Name -ne 'BareMetal.Minifier.js'
    } | ForEach-Object {
      $rel = $_.FullName
      $out = Get-OutPath $rel
      if (Test-Path $out) { [void]$list.Add($rel) }
    }
  }
  foreach ($rawPath in $Path) {
    foreach ($p in @($rawPath -split ',')) {
      $p = $p.Trim()
      if (-not $p) { continue }
      $full = if ([System.IO.Path]::IsPathRooted($p)) { $p } else { Join-Path $here $p }
      if (-not (Test-Path $full)) { throw "path not found: $p" }
      $item = Get-Item $full
      if ($item.PSIsContainer) { throw "path is a directory (pass files or use -All): $p" }
      [void]$list.Add($item.FullName)
    }
  }
  return @($list | Select-Object -Unique)
}

$targets = Resolve-Targets
if ($targets.Count -eq 0) { throw "no minify targets" }

if ($Port -le 0) { $Port = Get-Random -Minimum 9330 -Maximum 9930 }
$edgeCandidates = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$edge = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw "Microsoft Edge not found" }

$profile = Join-Path $env:TEMP ("bm-minify-{0}-{1}" -f $PID, [guid]::NewGuid().ToString("n"))
New-Item -ItemType Directory -Force -Path $profile | Out-Null
$hostUrl = ([Uri]$hostHtml).AbsoluteUri

$proc = $null
$ws = $null
$cts = New-Object System.Threading.CancellationTokenSource
$script:recvTask = $null
$script:recvBuf = $null
$msgId = 1

function Send-Cdp($wsock, $id, $method, $params) {
  $payload = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Compress -Depth 8
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
  $seg = New-Object System.ArraySegment[byte] (, $bytes)
  $wsock.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
}

function Recv-Cdp($wsock, $timeoutMs) {
  $sb = New-Object System.Text.StringBuilder
  $end = $false
  while (-not $end) {
    if ($null -eq $script:recvTask -or $script:recvTask.IsCompleted) {
      $script:recvBuf = New-Object byte[] 4194304
      $seg = New-Object System.ArraySegment[byte] (, $script:recvBuf)
      $script:recvTask = $wsock.ReceiveAsync($seg, $cts.Token)
    }
    if (-not $script:recvTask.Wait($timeoutMs)) { return $null }
    $r = $script:recvTask.Result
    $script:recvTask = $null
    [void]$sb.Append([System.Text.Encoding]::UTF8.GetString($script:recvBuf, 0, $r.Count))
    $end = $r.EndOfMessage
  }
  return $sb.ToString()
}

function Invoke-CdpEval([string]$expression) {
  $id = $script:msgId
  $script:msgId++
  Send-Cdp $ws $id "Runtime.evaluate" @{
    expression = $expression
    returnByValue = $true
    awaitPromise = $false
  }
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    $raw = Recv-Cdp $ws 2000
    if (-not $raw) { continue }
    try { $o = $raw | ConvertFrom-Json } catch { continue }
    if ($o.id -eq $id) {
      if ($o.result.exceptionDetails) {
        $ex = $o.result.exceptionDetails
        $msg = if ($ex.exception -and $ex.exception.description) { $ex.exception.description } else { [string]$ex.text }
        throw "CDP evaluate failed: $msg"
      }
      return $o.result.result
    }
  }
  throw "CDP evaluate timeout"
}

function Minify-Source([string]$kind, [string]$source) {
  $json = ConvertTo-Json -Compress -InputObject $source
  if ($kind -eq 'css') {
    $expr = "(function(){ var r = BareMetal.Minifier.minifyCSS($json); return { code: r.code, unsupported: !!r.unsupported, errors: r.errors || [] }; })()"
  } else {
    $expr = "(function(){ var r = BareMetal.Minifier.minifyJS($json); return { code: r.code, unsupported: !!r.unsupported, errors: r.errors || [] }; })()"
  }
  $result = Invoke-CdpEval $expr
  if ($result.type -ne 'object' -or -not $result.value) {
    throw "unexpected minify result type: $($result.type)"
  }
  return $result.value
}

$failed = New-Object System.Collections.Generic.List[string]
$okCount = 0

try {
  $proc = Start-Process -FilePath $edge -PassThru -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--allow-file-access-from-files",
    "--no-first-run",
    "--remote-debugging-port=$Port",
    "--user-data-dir=$profile",
    $hostUrl
  )

  $start = Get-Date
  $targetsList = $null
  while ($true) {
    try {
      $raw = Invoke-RestMethod "http://127.0.0.1:$Port/json/list"
      $targetsList = @($raw)
      if ($targetsList.Count -eq 1 -and $targetsList[0] -is [System.Array]) { $targetsList = @($targetsList[0]) }
      break
    } catch {
      if (((Get-Date) - $start).TotalSeconds -gt $StartupTimeoutSec) { throw "CDP not ready on port $Port" }
      Start-Sleep -Milliseconds 250
    }
  }

  $pages = @($targetsList | Where-Object { $_.type -eq "page" -and ([string]$_.url).Contains("minify-host.html") })
  if ($pages.Count -eq 0) { $pages = @($targetsList | Where-Object { $_.type -eq "page" }) }
  $target = $pages | Select-Object -Last 1
  if (-not $target) { throw "No CDP page target" }
  $wsUrl = [string](@($target.webSocketDebuggerUrl)[0])

  $ws = New-Object System.Net.WebSockets.ClientWebSocket
  $ws.ConnectAsync([Uri]$wsUrl, $cts.Token).Wait()
  Send-Cdp $ws ($script:msgId++) "Runtime.enable" @{}

  $readyDeadline = (Get-Date).AddSeconds($StartupTimeoutSec)
  $ready = $false
  while ((Get-Date) -lt $readyDeadline) {
    try {
      $st = Invoke-CdpEval "document.getElementById('minify-ready') && document.getElementById('minify-ready').getAttribute('data-ready')"
      if ($st.value -eq 'true') { $ready = $true; break }
    } catch { }
    Start-Sleep -Milliseconds 100
  }
  if (-not $ready) { throw "minify-host.html did not become ready" }

  foreach ($inPath in $targets) {
    $rel = $inPath.Substring($here.Length).TrimStart('\', '/')
    $outPath = Get-OutPath $inPath
    $kind = Get-Kind $inPath
    $source = [System.IO.File]::ReadAllText($inPath, [System.Text.UTF8Encoding]::new($false))
    try {
      $min = Minify-Source $kind $source
    } catch {
      [void]$failed.Add("$rel : $($_.Exception.Message)")
      continue
    }
    if ($min.unsupported) {
      $errJoin = (@($min.errors) | Where-Object { $_ }) -join '; '
      if (-not $errJoin) { $errJoin = 'unsupported' }
      [void]$failed.Add("$rel : unsupported ($errJoin)")
      continue
    }
    $code = [string]$min.code
    if ($mode -eq 'check') {
      if (-not (Test-Path $outPath)) {
        [void]$failed.Add("$rel : missing artefact $(Split-Path $outPath -Leaf)")
        continue
      }
      $existing = [System.IO.File]::ReadAllText($outPath, [System.Text.UTF8Encoding]::new($false))
      if ($existing -ne $code) {
        [void]$failed.Add(("{0} : drift (source {1} B, artefact {2} B, fresh {3} B)" -f $rel, $source.Length, $existing.Length, $code.Length))
        continue
      }
      Write-Host "ok $rel"
      $okCount++
    } elseif ($mode -eq 'write') {
      $utf8 = [System.Text.UTF8Encoding]::new($false)
      [System.IO.File]::WriteAllText($outPath, $code, $utf8)
      $outRel = $outPath.Substring($here.Length).TrimStart('\', '/')
      Write-Host "wrote $outRel ($($code.Length) B)"
      $okCount++
    } else {
      $existingLen = if (Test-Path $outPath) {
        ([System.IO.File]::ReadAllText($outPath, [System.Text.UTF8Encoding]::new($false))).Length
      } else { -1 }
      $drift = if ($existingLen -lt 0) { 'missing-artefact' } elseif ($existingLen -ne $code.Length) { 'size-drift' } else {
        $existing = [System.IO.File]::ReadAllText($outPath, [System.Text.UTF8Encoding]::new($false))
        if ($existing -ne $code) { 'content-drift' } else { 'match' }
      }
      Write-Host ("ok {0} fresh={1}B artefact={2} {3}" -f $rel, $code.Length, $(if ($existingLen -lt 0) { 'n/a' } else { "$existingLen`B" }), $drift)
      $okCount++
    }
  }
}
finally {
  if ($ws) { try { $ws.Abort() } catch {} }
  if ($proc -and -not $proc.HasExited) {
    try { & taskkill.exe /PID $proc.Id /T /F 2>$null | Out-Null } catch {}
  }
  if (Test-Path $profile) {
    Remove-Item -Recurse -Force $profile -ErrorAction SilentlyContinue
  }
}

Write-Host ("minify {0}: ok={1} failed={2} targets={3}" -f $mode, $okCount, $failed.Count, $targets.Count)
if ($failed.Count -gt 0) {
  foreach ($f in $failed) { Write-Host "FAIL $f" }
  exit 1
}
exit 0
