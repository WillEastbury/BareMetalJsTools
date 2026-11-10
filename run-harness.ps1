param(
  [string]$HarnessUrl = "",
  [switch]$Smoke,
  [switch]$Ci,
  [int]$Port = 0,
  [int]$TimeoutSec = 90,
  [int]$StartupTimeoutSec = 20
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$useSmoke = $Smoke -or $Ci
if (-not $HarnessUrl) {
  $html = Join-Path $here "harness.html"
  $HarnessUrl = ([Uri]$html).AbsoluteUri
  if ($useSmoke) {
    $sep = if ($HarnessUrl.Contains("?")) { "&" } else { "?" }
    $HarnessUrl = "$HarnessUrl${sep}manifest=smoke"
  }
} elseif ($useSmoke -and -not $HarnessUrl.Contains("manifest=")) {
  $sep = if ($HarnessUrl.Contains("?")) { "&" } else { "?" }
  $HarnessUrl = "$HarnessUrl${sep}manifest=smoke"
}
if ($Port -le 0) { $Port = Get-Random -Minimum 9330 -Maximum 9930 }

$edgeCandidates = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$edge = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { throw "Microsoft Edge not found" }

$profile = Join-Path $env:TEMP ("bm-harness-{0}-{1}" -f $PID, [guid]::NewGuid().ToString("n"))
New-Item -ItemType Directory -Force -Path $profile | Out-Null

$proc = $null
$ws = $null
$cts = New-Object System.Threading.CancellationTokenSource
$pageErrors = New-Object System.Collections.Generic.List[string]
$script:recvTask = $null
$script:recvBuf = $null

function Send-Cdp($wsock, $id, $method, $params) {
  $payload = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Compress -Depth 8
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
  $seg = New-Object System.ArraySegment[byte] (,$bytes)
  $wsock.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
}

function Recv-Cdp($wsock, $timeoutMs) {
  $sb = New-Object System.Text.StringBuilder
  $end = $false
  while (-not $end) {
    if ($null -eq $script:recvTask -or $script:recvTask.IsCompleted) {
      $script:recvBuf = New-Object byte[] 1048576
      $seg = New-Object System.ArraySegment[byte] (,$script:recvBuf)
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

try {
  $proc = Start-Process -FilePath $edge -PassThru -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--allow-file-access-from-files",
    "--no-first-run",
    "--remote-debugging-port=$Port",
    "--user-data-dir=$profile",
    $HarnessUrl
  )

  $start = Get-Date
  $targets = $null
  while ($true) {
    try {
      $raw = Invoke-RestMethod "http://127.0.0.1:$Port/json/list"
      $targets = @($raw)
      if ($targets.Count -eq 1 -and $targets[0] -is [System.Array]) { $targets = @($targets[0]) }
      break
    } catch {
      if (((Get-Date) - $start).TotalSeconds -gt $StartupTimeoutSec) { throw "CDP not ready on port $Port" }
      Start-Sleep -Milliseconds 250
    }
  }

  $pages = @($targets | Where-Object { $_.type -eq "page" -and ([string]$_.url).Contains("harness.html") })
  if ($pages.Count -eq 0) {
    $pages = @($targets | Where-Object { $_.type -eq "page" })
  }
  $target = $pages | Select-Object -Last 1
  if (-not $target) { throw "No CDP page target" }
  $wsUrl = [string](@($target.webSocketDebuggerUrl)[0])

  $ws = New-Object System.Net.WebSockets.ClientWebSocket
  $ws.ConnectAsync([Uri]$wsUrl, $cts.Token).Wait()
  Send-Cdp $ws 1 "Runtime.enable" @{}

  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  $val = $null
  $pollId = 10
  $poll = "var el=document.getElementById('test-results'); el && el.getAttribute('data-complete')==='true' ? {passed:+el.getAttribute('data-passed'), failed:+el.getAttribute('data-failed'), skipped:+(el.getAttribute('data-skipped')||0), total:+(el.getAttribute('data-total')||0), generation:+(el.getAttribute('data-generation')||0), fails:el.getAttribute('data-fails')||''} : null"

  Send-Cdp $ws $pollId "Runtime.evaluate" @{ expression = $poll; returnByValue = $true }

  while ((Get-Date) -lt $deadline) {
    $raw = Recv-Cdp $ws 1500
    if (-not $raw) {
      $pollId++
      Send-Cdp $ws $pollId "Runtime.evaluate" @{ expression = $poll; returnByValue = $true }
      continue
    }
    try { $o = $raw | ConvertFrom-Json } catch { continue }
    if ($o.method -eq "Runtime.exceptionThrown") {
      $pageErrors.Add([string]$o.params.exceptionDetails.text)
      continue
    }
    if ($o.id -eq $pollId) {
      if ($o.result.result.value) {
        $val = $o.result.result.value
        break
      }
      $pollId++
      Send-Cdp $ws $pollId "Runtime.evaluate" @{ expression = $poll; returnByValue = $true }
    }
  }

  if (-not $val) { throw "Timeout waiting for harness completion" }
  Write-Host ("passed={0} failed={1} skipped={2} total={3} generation={4}" -f $val.passed, $val.failed, $val.skipped, $val.total, $val.generation)
  if ($val.fails) { Write-Host ("fails={0}" -f $val.fails) }
  if ($pageErrors.Count -gt 0) {
    Write-Host ("page-errors={0}" -f ($pageErrors -join " | "))
    throw "unexpected page errors"
  }
  if ([int]$val.failed -gt 0) { exit 1 }
  if ([int]$val.skipped -gt 0) { throw "skipped tests are not allowed" }
  if ([int]$val.passed -le 0) { throw "zero tests passed" }
  if ([int]$val.generation -gt 1) { throw "tests ran more than once (generation=$($val.generation))" }
  exit 0
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
