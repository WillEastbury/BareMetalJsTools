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

function Title-Module([string]$key, [string]$exportPath) {
  if ($key -eq 'styles') { return 'BareMetal.Styles' }
  if ($key -eq 'styles/bootstrap-shim') { return 'BareMetal.Styles.BootstrapCompatibilityShim' }
  return [IO.Path]::GetFileNameWithoutExtension($exportPath)
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
  $candidate = $title + '.md'
  if (Test-Path (Join-Path $docsRoot $candidate)) { return $candidate }
  if ($key -eq 'styles') { return 'BareMetal.Styles.md' }
  if ($key -eq 'control-surfaces') { return 'ControlSurfaces.md' }
  return 'modules/' + $title + '.md'
}

function Extract-PublicApi([string]$sourcePath, [string]$docsPath) {
  if ($docsPath -and (Test-Path $docsPath)) {
    $docText = Get-Content $docsPath -Raw
    $documented = New-Object System.Collections.Generic.List[string]
    [regex]::Matches($docText, '(?m)^#{2,4}\s+`([^`]+)`') | ForEach-Object {
      [void]$documented.Add($_.Groups[1].Value)
    }
    if ($documented.Count) { return @($documented | Select-Object -Unique) }
  }
  if (-not (Test-Path $sourcePath)) { return @() }
  $text = Get-Content $sourcePath -Raw
  $matches = [regex]::Matches($text, '(?ms)^\s*return\s*\{(.+?)^\s*\};')
  if (-not $matches.Count) { return @() }
  $last = $matches[0].Groups[1].Value
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

function Undocumented-Api([string]$key) {
  $map = @{
    'audio-mixer' = @('create(options)')
    'authenticator' = @('setup(userId, options)','verify(code, secret, options)','generate(secret, options)','challenge(session, options)','protect(fn, options)','replayGuard(secret, options)','backupVerify(code, backupCodes)','qrSvg(uri, options)')
    'blob' = @('usage(options)','create(options)','chunk(blob, options)','upload(blob, options)','resume(token, options)','download(id, options)','hash(blob, options)','store(adapter)','lifecycle(options)','transform(blob, options)','encrypt(blob, key)','decrypt(blob, key)')
    'control-surface' = @('create(options)')
    'docchain' = @('defineType(name, schema)','create(type, data, options)','derive(parent, type, data)','transition(document, status)','validate(document)','lineage(id)','auditTrail(id)','store')
    'inbox' = @('create(options)')
    'input-router' = @('create(options)')
    'minifier' = @('minifyJS(source, options)','minifyCSS(source, options)','compressGzip(source, options)','decompressGzip(source, options)')
    'print' = @('render(document, options)','paginate(document, options)','print(document, options)','preview(document, options)','receipt(data, options)','invoice(data, options)','document(data, options)','barcode(value, options)','qr(value, options)')
    'scan' = @('capture(options)','stream(options)','decode(image, options)','decodeQR(image, options)','decodeBarcode(image, options)','ocr(image, options)','map(value, options)','validate(result, options)','continuous(options)','overlay(result, options)','history()','fromImage(image, options)','fromBlob(blob, options)')
    'scene-inspector' = @('create(options)')
    'schedule' = @('cron(expression, callback, options)','interval(ms, callback)','delay(ms, callback)','at(date, callback)','every(interval, callback)','queue(options)','scheduler(options)','debounce(fn, wait)','throttle(fn, wait)','retry(fn, options)')
    'search' = @('createIndex(options)','tokenize(text, options)','stem(token, language)','highlight(text, terms)','pipeline(options)')
    'tabs' = @('create(options)')
    'tenant' = @('create(options)','resolve(id)','switch(id)','isolate(id, fn)','partition(id)','hierarchy(id)','limits(id)','features(id)','suspend(id)','activate(id)')
    'theme-picker' = @('create(options)')
    'timeline' = @('create(options)','formatTime(seconds)')
    'vector' = @('createDatabase(options)','cosineSimilarity(a, b)')
    'vectorsearch' = @('createIndex(options)','cosineSimilarity(a, b)')
  }
  if ($map.ContainsKey($key)) { return $map[$key] }
  return @()
}

function Undocumented-Sample([string]$key, [string]$title, [string]$source) {
  $map = @{
    'audio-mixer' = "const mixer = BareMetal.AudioMixer.create({ tracks: [] });`nmixer.addTrack({ id:'deck-a', label:'Deck A', gain:1 });"
    'control-surface' = "const panel = BareMetal.ControlSurface.create({ title:'Settings', fields:[{ name:'level', type:'range', min:0, max:1, defaultValue:0.7 }] });`ndocument.querySelector('#app').append(panel.element);"
    'input-router' = "const router = BareMetal.InputRouter.create({ element:document, onAction:event => console.log(event.action) });"
    'minifier' = "const min = BareMetal.Minifier.minifyJS(source);`nconst packed = await BareMetal.Minifier.compressGzip(min.code);"
    'scene-inspector' = "const inspector = BareMetal.SceneInspector.create({ targets:[scene], adapter });`ndocument.querySelector('#app').append(inspector.element);"
    'tabs' = "const tabs = BareMetal.Tabs.create({ items:[{id:'one',label:'One',content:panelOne},{id:'two',label:'Two',content:panelTwo}] });`ndocument.querySelector('#app').append(tabs.element);"
    'theme-picker' = "const picker = BareMetal.ThemePicker.create({ themes, selected:'wavefunction', link:themeLink });`ndocument.querySelector('#settings').append(picker.element);"
    'timeline' = "const timeline = BareMetal.Timeline.create({ duration:120, onSeek:seconds => player.seek(seconds) });`ndocument.querySelector('#player').append(timeline.element);"
    'vector' = "const db = BareMetal.Vector.createDatabase();`nconst collection = db.createCollection('tracks');`ncollection.upsert('track-1', embedding, { title:'Blue Monday' });"
    'vectorsearch' = "const index = BareMetal.VectorSearch.createIndex({ dimensions:3 });`nindex.upsert('track-1', new Float32Array([0.1,0.2,0.3]));`nconst matches = index.topK(query, 5);"
  }
  if ($map.ContainsKey($key)) { return $map[$key] }
  return "const moduleApi = BareMetal." + $title.Replace('BareMetal.','') + ";`n// Source: " + $source + "`n// See the public API list below for call signatures."
}

function Extract-Sample([string]$docsPath, [string]$sourcePath) {
  if ($docsPath -and (Test-Path $docsPath)) {
    $docText = Get-Content $docsPath -Raw
    $code = [regex]::Match($docText, '(?is)```(?:js|javascript)\s*\r?\n(.*?)\r?\n```')
    if (-not $code.Success) {
      $code = [regex]::Match($docText, '(?is)```html\s*\r?\n(.*?)\r?\n```')
    }
    if ($code.Success) { return $code.Groups[1].Value.Trim() }
  }
  return $null
}

$entries = New-Object System.Collections.Generic.List[object]
$package.Exports.PSObject.Properties | Sort-Object Name | ForEach-Object {
  $key = $_.Name
  $key = $key.TrimStart('.')
  $key = $key.TrimStart('/')
  $exportPath = $_.Value
  if ($key -match '\.(css)$' -or $exportPath -notmatch '\.js$') { return }
  $title = Title-Module $key $exportPath
  $sourcePath = Join-Path $root $exportPath
  $docPath = Doc-Path $key $title
  if ($docPath -and $docPath.StartsWith('modules/')) {
    $generatedDocPath = Join-Path $docsRoot $docPath
    $null = New-Item -ItemType Directory -Force -Path (Split-Path $generatedDocPath -Parent)
    $apiFallback = Undocumented-Api $key
    if (-not $apiFallback.Count) { $apiFallback = Extract-PublicApi $sourcePath $null }
    $usage = Undocumented-Sample $key $title $exportPath
    $doc = @(
      "# $title",
      '',
      "Dependency-free browser module. Source: ``$exportPath``.",
      '',
      '## Load',
      '',
      '```html',
      "<script src=`"../$($exportPath.Replace('./',''))`"></script>",
      '```',
      '',
      '## Public API',
      ''
    )
    foreach ($method in $apiFallback) {
      $doc += "### ``$method``"
      $doc += ''
      $doc += 'Call `BareMetal.' + $title.Replace('BareMetal.','') + '.' + $method.Split('(')[0] + '(...)` using the arguments shown by the function implementation.'
      $doc += ''
    }
    $doc += '## Example'
    $doc += ''
    $doc += '```js'
    $doc += $usage
    $doc += '```'
    $doc += ''
    [IO.File]::WriteAllText($generatedDocPath, ($doc -join "`n"), [Text.UTF8Encoding]::new($false))
    $docPath = $generatedDocPath
  } elseif ($docPath) {
    $docPath = Join-Path $docsRoot $docPath
  }
  $api = Extract-PublicApi $sourcePath $docPath
  $sample = Extract-Sample $docPath $exportPath
  if (-not $sample) { $sample = Undocumented-Sample $key $title $exportPath }
  $entries.Add([PSCustomObject]@{
    key = $key
    title = $title
    source = $exportPath
    docs = if ($docPath) { $docPath.Substring($docsRoot.Length).TrimStart('\','/').Replace('\','/') } else { $null }
    api = @($api)
    sample = $sample
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
  [void]$md.Add('```js')
  [void]$md.Add($entry.sample)
  [void]$md.Add('```')
  [void]$md.Add('')
  [void]$md.Add('### Public API')
  [void]$md.Add('')
  [void]$md.Add(('`' + ($entry.api -join '`, `') + '`'))
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
