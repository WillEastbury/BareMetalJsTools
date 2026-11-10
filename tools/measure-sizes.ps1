param(
  [switch]$WriteReadme,
  [int]$Port = 0,
  [int]$TimeoutSec = 600
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$readme = Join-Path $root "README.md"
$reportJson = Join-Path $PSScriptRoot "module-sizes.json"
if ($Port -le 0) { $Port = Get-Random -Minimum 9330 -Maximum 9930 }

$edgeCandidates = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$edge = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw "Microsoft Edge not found" }

$profile = Join-Path $env:TEMP ("bm-size-{0}-{1}" -f $PID, [guid]::NewGuid().ToString("n"))
New-Item -ItemType Directory -Force -Path $profile | Out-Null

$server = $null
$edgeProc = $null
$ws = $null
$cts = New-Object System.Threading.CancellationTokenSource
$recvTask = $null
$recvBuf = $null

function Send-Cdp($sock, $id, $method, $params) {
  $payload = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Compress -Depth 8
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
  $segment = New-Object System.ArraySegment[byte] (,$bytes)
  $sock.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
}

function Receive-Cdp($sock, $timeoutMs) {
  $builder = New-Object System.Text.StringBuilder
  $done = $false
  while (-not $done) {
    if ($null -eq $recvTask -or $recvTask.IsCompleted) {
      $recvBuf = New-Object byte[] 4194304
      $segment = New-Object System.ArraySegment[byte] (,$recvBuf)
      $recvTask = $sock.ReceiveAsync($segment, $cts.Token)
    }
    if (-not $recvTask.Wait($timeoutMs)) { return $null }
    $received = $recvTask.Result
    $recvTask = $null
    [void]$builder.Append([System.Text.Encoding]::UTF8.GetString($recvBuf, 0, $received.Count))
    $done = $received.EndOfMessage
  }
  return $builder.ToString()
}

try {
  $server = Start-Process -FilePath "python" -ArgumentList @("-m", "http.server", "8768", "--directory", $root) -PassThru
  $hostUrl = "http://127.0.0.1:8768/size-host.html"

  $deadline = (Get-Date).AddSeconds(20)
  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-RestMethod "http://127.0.0.1:8768/package.json" | Out-Null
      break
    } catch { Start-Sleep -Milliseconds 100 }
  }

  $edgeProc = Start-Process -FilePath $edge -PassThru -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--remote-debugging-port=$Port",
    "--user-data-dir=$profile",
    $hostUrl
  )

  $deadline = (Get-Date).AddSeconds(20)
  $targets = $null
  while ((Get-Date) -lt $deadline) {
    try {
      $targets = @(Invoke-RestMethod "http://127.0.0.1:$Port/json/list")
      break
    } catch { Start-Sleep -Milliseconds 100 }
  }
  if (-not $targets) { throw "CDP target list unavailable" }
  $target = @($targets | Where-Object { $_.type -eq "page" }) | Select-Object -Last 1
  if (-not $target) { throw "No browser page target" }

  $ws = New-Object System.Net.WebSockets.ClientWebSocket
  $wsUrl = [string](@($target.webSocketDebuggerUrl)[0])
  $ws.ConnectAsync([Uri]$wsUrl, $cts.Token).Wait()
  Send-Cdp $ws 1 "Runtime.enable" @{}

  $pollId = 2
  $expression = "var el=document.getElementById('size-report');el&&el.getAttribute('data-complete')==='true'?el.textContent:null"
  Send-Cdp $ws $pollId "Runtime.evaluate" @{ expression = $expression; returnByValue = $true }
  $rawResult = $null
  $deadline = (Get-Date).AddSeconds($TimeoutSec)

  while ((Get-Date) -lt $deadline) {
    $raw = Receive-Cdp $ws 1500
    if (-not $raw) {
      $pollId++
      Send-Cdp $ws $pollId "Runtime.evaluate" @{ expression = $expression; returnByValue = $true }
      continue
    }
    try { $message = $raw | ConvertFrom-Json } catch { continue }
    if ($message.id -eq $pollId) {
      if ($message.result.result.value) {
        $rawResult = [string]$message.result.result.value
        break
      }
      $pollId++
      Send-Cdp $ws $pollId "Runtime.evaluate" @{ expression = $expression; returnByValue = $true }
    }
  }
  if (-not $rawResult) { throw "Timeout waiting for BareMetal.Minifier gzip size report" }

  $report = $rawResult | ConvertFrom-Json
  if ($report.error) { throw [string]$report.error }
  $rawResult | Set-Content -Encoding UTF8 $reportJson

  $sizes = @{}
  foreach ($item in @($report.results)) {
    if (-not $item.error) { $sizes[[string]$item.path] = $item }
  }

  foreach ($item in $sizes.Values | Sort-Object path) {
    Write-Host ("{0} raw={1:N1} KB gzip={2:N1} KB" -f
      $item.path,
      ([double]$item.rawBytes / 1024),
      ([double]$item.gzipBytes / 1024))
  }

  if ($WriteReadme) {
    $text = [System.IO.File]::ReadAllText($readme)
    $pattern = '\[([^\]]*?(?:KB|source|JS|CSS)[^\]]*?)\]\(([^)]+)\)'
    $text = [regex]::Replace($text, $pattern, {
      param($match)
      $href = $match.Groups[2].Value
      if ($href -notmatch '^src/') { return $match.Value }
      $key = $href.TrimStart('/')
      if (-not $sizes.ContainsKey($key)) { return $match.Value }
      $item = $sizes[$key]
      $replacement = ('{0:N1} KB raw / {1:N1} KB gzip' -f
        ([double]$item.rawBytes / 1024),
        ([double]$item.gzipBytes / 1024))
      return '[' + $replacement + '](' + $href + ')'
    })
    [System.IO.File]::WriteAllText($readme, $text, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Updated README.md size labels"
  }
} finally {
  if ($ws) { try { $ws.Abort() } catch {} }
  if ($edgeProc -and -not $edgeProc.HasExited) {
    try { & taskkill.exe /PID $edgeProc.Id /T /F 2>$null | Out-Null } catch {}
  }
  if ($server -and -not $server.HasExited) {
    try { Stop-Process -Id $server.Id -Force } catch {}
  }
  if (Test-Path $profile) { Remove-Item -Recurse -Force $profile -ErrorAction SilentlyContinue }
}
