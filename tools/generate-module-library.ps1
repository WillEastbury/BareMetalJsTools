param(
  [switch]$Write
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$packagePath = Join-Path $root 'package.json'
$docsRoot = Join-Path $root 'docs'
$outputJson = Join-Path $docsRoot 'module-library.json'
$outputMd = Join-Path $docsRoot 'API-Library.md'
$package = Get-Content $packagePath -Raw | ConvertFrom-Json

function Title-Module([string]$key) {
  if ($key -eq 'styles') { return 'BareMetal.Styles' }
  if ($key -eq 'styles/bootstrap-shim') { return 'BareMetal.Styles.BootstrapCompatibilityShim' }
  $parts = $key.Split('-')
  $name = ($parts | ForEach-Object {
    if ($_ -eq 'idb') { 'IDB' }
    elseif ($_ -eq 'i18n') { 'I18n' }
    elseif ($_ -eq 'rbac') { 'RBAC' }
    elseif ($_ -eq 'url') { 'URL' }
    elseif ($_ -eq 'picoscript') { 'PicoScript' }
    elseif ($_ -eq '3dxr') { '3DXR' }
    elseif ($_ -eq 'mp3') { 'MP3' }
    elseif ($_ -eq 'dj') { 'DJ' }
    elseif ($_ -eq 'vt') { 'VT' }
    elseif ($_ -eq 'id3') { 'ID3' }
    elseif ($_ -eq 'midi') { 'MIDI' }
    elseif ($_ -eq 'mp3catalog') { 'MP3Catalog' }
    elseif ($_.Length -gt 0) { $_.Substring(0,1).ToUpperInvariant() + $_.Substring(1) }
    else { $_ }
  }) -join ''
  return 'BareMetal.' + $name
}

function Doc-Path([string]$key, [string]$title) {
  $specific = @{
    'bind'='BareMetal.Bind.md'
    'components'='BareMetal.Components.md'
    'component-factories'='BareMetal.ComponentFactories.md'
    'test-runner'='BareMetal.TestRunner.md'
    'secure-transport'='BareMetal.SecureTransport.md'
    'module-loader'='BareMetal.ModuleLoader.md'
    'integrity'='BareMetal.Integrity.md'
    'midi'='BareMetal.MIDI.md'
    'midi-profiles'='BareMetal.MIDIProfiles.md'
    'mp3-catalog'='BareMetal.MP3Catalog.md'
    'dj-mixer'='BareMetal.DJMixer.md'
    'dj-deck'='BareMetal.DJDeck.md'
    'dj-library'='BareMetal.DJLibrary.md'
    'vt-terminal'='BareMetal.VTTerminal.md'
  }
  if ($specific.ContainsKey($key)) { return $specific[$key] }
  $candidate = $title.Replace('BareMetal.','BareMetal.') + '.md'
  if (Test-Path (Join-Path $docsRoot $candidate)) { return $candidate }
  if ($key -eq 'styles') { return 'BareMetal.Styles.md' }
  if ($key -eq 'control-surfaces') { return 'ControlSurfaces.md' }
  return $null
}

function Extract-PublicApi([string]$sourcePath) {
  if (-not (Test-Path $sourcePath)) { return @() }
  $text = Get-Content $sourcePath -Raw
  $matches = [regex]::Matches($text, '(?ms)^[ \t]*return\s*\{(.+?)^\s*\};')
  if (-not $matches.Count) { return @() }
  $last = $matches[$matches.Count - 1].Groups[1].Value
  $names = New-Object System.Collections.Generic.List[string]
  [regex]::Matches($last, '(?m)^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*') | ForEach-Object {
    [void]$names.Add($_.Groups[1].Value)
  }
  [regex]::Matches($last, '(?m)^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*,') | ForEach-Object {
    [void]$names.Add($_.Groups[1].Value)
  }
  [regex]::Matches($last, '(?m)^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*$') | ForEach-Object {
    [void]$names.Add($_.Groups[1].Value)
  }
  return @($names | Select-Object -Unique)
}

function Escape-Html([string]$text) {
  return [System.Security.SecurityElement]::Escape($text)
}

$entries = New-Object System.Collections.Generic.List[object]
$package.Exports.PSObject.Properties | Sort-Object Name | ForEach-Object {
  $key = $_.Name
  $key = $key.TrimStart('.')
  $key = $key.TrimStart('/')
  $exportPath = $_.Value
  if ($key -match '\.(css)$' -or $exportPath -notmatch '\.js$') { return }
  $title = Title-Module $key
  $sourcePath = Join-Path $root $exportPath
  $docPath = Doc-Path $key $title
  $api = Extract-PublicApi $sourcePath
  $firstCall = if ($api.Count) { $api[0] } else { 'create' }
  $snippet = "const result = BareMetal.$($title.Replace('BareMetal.','')).$firstCall();"
  $entries.Add([PSCustomObject]@{
    key = $key
    title = $title
    source = $exportPath
    docs = $docPath
    api = @($api)
  })
}

$libraryJson = @{
  generated = [DateTime]::UtcNow.ToString('s') + 'Z'
  modules = @($entries.ToArray())
}
$jsonText = $libraryJson | ConvertTo-Json -Depth 6
if ($Write) {
  [System.IO.File]::WriteAllText($outputJson, $jsonText, [System.Text.UTF8Encoding]::new($false))
}

$md = New-Object System.Collections.Generic.List[string]
[void]$md.Add('# BareMetalJsTools API Library')
[void]$md.Add('')
[void]$md.Add('Generated implementation and function-calling catalog.')
[void]$md.Add('')
[void]$md.Add('| Module | Browser load | Public API | Documentation |')
[void]$md.Add('|---|---|---|---|')
foreach ($entry in $entries) {
  $apiText = if ($entry.api.Count) { ('`' + ($entry.api -join '`, `') + '`') } else { '`<module API>`' }
  $docLink = if ($entry.docs) { '[' + $entry.title + '](' + $entry.docs + ')' } else { $entry.title }
  $load = '<script src="' + $entry.source.Replace('./','') + '"></script>'
  [void]$md.Add('| ' + $docLink + ' | `' + $load + '` | ' + $apiText + ' | ' + $docLink + ' |')
}
[void]$md.Add('')
foreach ($entry in $entries) {
  [void]$md.Add('## ' + $entry.title)
  [void]$md.Add('')
  [void]$md.Add('```html')
  [void]$md.Add('<script src="' + $entry.source.Replace('./','') + '"></script>')
  [void]$md.Add('```')
  [void]$md.Add('')
  $namespace = $entry.title.Replace('BareMetal.','')
  [void]$md.Add('```js')
  [void]$md.Add('const moduleApi = BareMetal.' + $namespace + ';')
  [void]$md.Add("const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;")
  if ($entry.api.Count) {
    foreach ($name in $entry.api) {
      [void]$md.Add("// Public function: " + $name)
      [void]$md.Add("if (typeof instance." + $name + " === 'function') {")
      [void]$md.Add("  // const result = instance." + $name + "(/* arguments */);")
      [void]$md.Add('}')
    }
  } else {
    [void]$md.Add('// Consult the module source or implementation guide for arguments.')
  }
  [void]$md.Add('```')
  [void]$md.Add('')
  if ($entry.docs) {
    [void]$md.Add('Implementation guide: [' + $entry.docs + '](' + $entry.docs + ')')
  }
  [void]$md.Add('')
}
if ($Write) {
  [System.IO.File]::WriteAllText($outputMd, ($md -join "`n"), [System.Text.UTF8Encoding]::new($false))
}

Write-Host ("Generated module library: " + $entries.Count + " modules")
