# BareMetalJsTools API Library

Generated implementation and function-calling catalog.

| Module | Browser load | Public API | Documentation |
|---|---|---|---|
| [BareMetal.3DXR](BareMetal.3DXR.md) | `<script src="src/BareMetal.3DXR.js"></script>` | `VERSION`, `create`, `isSupported` | [BareMetal.3DXR](BareMetal.3DXR.md) |
| [BareMetal.A11y](BareMetal.A11y.md) | `<script src="src/BareMetal.A11y.js"></script>` | `focusTrap`, `announce`, `skipNav`, `roving`, `prefersReducedMotion`, `prefersColorScheme`, `onMotionChange`, `onSchemeChange` | [BareMetal.A11y](BareMetal.A11y.md) |
| [BareMetal.Animate](BareMetal.Animate.md) | `<script src="src/BareMetal.Animate.js"></script>` | `enter`, `leave`, `toggle`, `move`, `list`, `prefersReducedMotion` | [BareMetal.Animate](BareMetal.Animate.md) |
| BareMetal.AudioMixer | `<script src="src/BareMetal.AudioMixer.js"></script>` | `<module API>` | BareMetal.AudioMixer |
| [BareMetal.Auth](BareMetal.Auth.md) | `<script src="src/BareMetal.Auth.js"></script>` | `configure`, `initialize`, `login`, `handleCallback`, `logout`, `clearSession`, `getToken`, `getIdToken`, `silentRefresh`, `handleSilentCallback`, `getUser`, `getUserInfo`, `isAuthenticated`, `onAuthChange`, `attachToRest`, `_setRedirect`, `parseJwt`, `createPkce`, `decodeJwtParts`, `renderLogin`, `renderLogout`, `renderWhoami`, `renderTokenInspector`, `renderUserTiles`, `renderAuthGate` | [BareMetal.Auth](BareMetal.Auth.md) |
| BareMetal.Authenticator | `<script src="src/BareMetal.Authenticator.js"></script>` | `setup`, `verify`, `generate`, `challenge`, `protect`, `lastVerified`, `timeSinceVerify`, `replayGuard`, `backupVerify`, `qrSvg`, `base32encode`, `base32decode`, `hmacSha1`, `hotp`, `totp`, `policy`, `events`, `onSetup`, `onVerify`, `onFail`, `onChallenge` | BareMetal.Authenticator |
| [BareMetal.Binary](BareMetal.Binary.md) | `<script src="src/BareMetal.Binary.js"></script>` | `setSigningKey`, `deserialize`, `fetchLayout`, `SpanReader` | [BareMetal.Binary](BareMetal.Binary.md) |
| [BareMetal.Bind](BareMetal.Bind.md) | `<script src="src/BareMetal.Bind.js"></script>` | `reactive`, `getPath`, `resolveInScope`, `appendList` | [BareMetal.Bind](BareMetal.Bind.md) |
| BareMetal.Blob | `<script src="src/BareMetal.Blob.js"></script>` | `usage`, `create`, `chunk`, `upload`, `resume`, `download`, `hash`, `store`, `lifecycle`, `transform`, `encrypt`, `decrypt`, `compress`, `decompress`, `toDataURL`, `fromDataURL`, `toBase64`, `fromBase64`, `slice`, `concat`, `diff`, `fingerprint`, `quota` | BareMetal.Blob |
| [BareMetal.Cache](BareMetal.Cache.md) | `<script src="src/BareMetal.Cache.js"></script>` | `get`, `set`, `has`, `delete`, `clear`, `size`, `keys`, `entries`, `wrap`, `invalidate`, `invalidateByTag`, `prune`, `stats`, `hits`, `misses`, `hitRate`, `evictions` | [BareMetal.Cache](BareMetal.Cache.md) |
| [BareMetal.Capabilities](BareMetal.Capabilities.md) | `<script src="src/BareMetal.Capabilities.js"></script>` | `compatible`, `missing`, `optional` | [BareMetal.Capabilities](BareMetal.Capabilities.md) |
| [BareMetal.Charts](BareMetal.Charts.md) | `<script src="src/BareMetal.Charts.js"></script>` | `<module API>` | [BareMetal.Charts](BareMetal.Charts.md) |
| [BareMetal.Clipboard](BareMetal.Clipboard.md) | `<script src="src/BareMetal.Clipboard.js"></script>` | `<module API>` | [BareMetal.Clipboard](BareMetal.Clipboard.md) |
| [BareMetal.Codes](BareMetal.Codes.md) | `<script src="src/BareMetal.Codes.js"></script>` | `<module API>` | [BareMetal.Codes](BareMetal.Codes.md) |
| [BareMetal.Colour](BareMetal.Colour.md) | `<script src="src/BareMetal.Colour.js"></script>` | `el`, `get`, `set`, `open`, `close` | [BareMetal.Colour](BareMetal.Colour.md) |
| [BareMetal.Communications](BareMetal.Communications.md) | `<script src="src/BareMetal.Communications.js"></script>` | `records`, `setRoot`, `connectWs`, `setSecureTransport` | [BareMetal.Communications](BareMetal.Communications.md) |
| [BareMetal.ComponentFactories](BareMetal.ComponentFactories.md) | `<script src="src/BareMetal.ComponentFactories.js"></script>` | `<module API>` | [BareMetal.ComponentFactories](BareMetal.ComponentFactories.md) |
| [BareMetal.Components](BareMetal.Components.md) | `<script src="src/BareMetal.Components.js"></script>` | `header` | [BareMetal.Components](BareMetal.Components.md) |
| [BareMetal.Compress](BareMetal.Compress.md) | `<script src="src/BareMetal.Compress.js"></script>` | `<module API>` | [BareMetal.Compress](BareMetal.Compress.md) |
| [BareMetal.Config](BareMetal.Config.md) | `<script src="src/BareMetal.Config.js"></script>` | `create`, `priorities` | [BareMetal.Config](BareMetal.Config.md) |
| [BareMetal.Controls](BareMetal.Controls.md) | `<script src="src/BareMetal.Controls.js"></script>` | `<module API>` | [BareMetal.Controls](BareMetal.Controls.md) |
| BareMetal.ControlSurface | `<script src="src/BareMetal.ControlSurface.js"></script>` | `<module API>` | BareMetal.ControlSurface |
| [BareMetal.Crypto](BareMetal.Crypto.md) | `<script src="src/BareMetal.Crypto.js"></script>` | `name`, `modulusLength`, `publicExponent`, `hash`, `default`, `iv`, `baseKey`, `generateSymmetricKey`, `generateAsymmetricKey`, `digest`, `generateSigningKey`, `exportKey`, `toBase64Url` | [BareMetal.Crypto](BareMetal.Crypto.md) |
| [BareMetal.Diagnostics](BareMetal.Diagnostics.md) | `<script src="src/BareMetal.Diagnostics.js"></script>` | `trace`, `span`, `timeline`, `inspect`, `why`, `watch`, `perf`, `counter`, `gauge`, `report`, `enable`, `disable`, `hook` | [BareMetal.Diagnostics](BareMetal.Diagnostics.md) |
| [BareMetal.DJDeck](BareMetal.DJDeck.md) | `<script src="src/BareMetal.DJDeck.js"></script>` | `audio`, `loadFile`, `loadUrl`, `play`, `pause`, `cue`, `setCuePoint`, `setHotCue`, `jumpHotCue`, `seek`, `nudge`, `setPitch`, `setTempo`, `setLoop`, `getLoop`, `sync`, `state`, `onChange`, `destroy` | [BareMetal.DJDeck](BareMetal.DJDeck.md) |
| [BareMetal.DJLibrary](BareMetal.DJLibrary.md) | `<script src="src/BareMetal.DJLibrary.js"></script>` | `saveTrack`, `getTrack`, `listTracks`, `deleteTrack`, `search`, `saveCues`, `getCues`, `savePlaylist`, `getPlaylist`, `saveSetting`, `getSetting` | [BareMetal.DJLibrary](BareMetal.DJLibrary.md) |
| [BareMetal.DJMixer](BareMetal.DJMixer.md) | `<script src="src/BareMetal.DJMixer.js"></script>` | `context`, `addChannel`, `setChannel`, `setCrossfader`, `setPitch`, `setPitchBend`, `setMasterGain`, `setCrossfaderCurve`, `setLimiter`, `setCue`, `toggleCue`, `setCueGain`, `setPreviewMix`, `getCueState`, `cueMeter`, `createPreviewControl`, `meter`, `state`, `getState`, `destroy` | [BareMetal.DJMixer](BareMetal.DJMixer.md) |
| BareMetal.Docchain | `<script src="src/BareMetal.DocChain.js"></script>` | `type`, `id`, `data`, `status`, `parentId`, `children`, `created`, `updated`, `version`, `meta`, `auditTrail` | BareMetal.Docchain |
| [BareMetal.Document](BareMetal.Document.md) | `<script src="src/BareMetal.Document.js"></script>` | `el`, `page`, `getHTML`, `setHTML`, `command`, `bold`, `italic`, `underline`, `heading`, `paragraph`, `list`, `color`, `hilite`, `font`, `fontSize`, `query` | [BareMetal.Document](BareMetal.Document.md) |
| [BareMetal.Documentwal](BareMetal.Documentwal.md) | `<script src="src/BareMetal.DocumentWAL.js"></script>` | `create`, `memoryTransport`, `httpTransport`, `getPath`, `setPath` | [BareMetal.Documentwal](BareMetal.Documentwal.md) |
| [BareMetal.DragDrop](BareMetal.DragDrop.md) | `<script src="src/BareMetal.DragDrop.js"></script>` | `draggable`, `droppable`, `sortable` | [BareMetal.DragDrop](BareMetal.DragDrop.md) |
| [BareMetal.Errors](BareMetal.Errors.md) | `<script src="src/BareMetal.Errors.js"></script>` | `BareMetalError`, `create`, `classify`, `isRetryable`, `isTransient`, `chain`, `getChain`, `toUserSafe`, `toJSON`, `fromJSON`, `wrap`, `assert`, `codes`, `register`, `lookup`, `match`, `aggregate`, `boundary` | [BareMetal.Errors](BareMetal.Errors.md) |
| [BareMetal.Expressions](BareMetal.Expressions.md) | `<script src="src/BareMetal.Expressions.js"></script>` | `hex`, `description`, `pattern`, `examples`, `extract`, `detect`, `validate`, `prepare`, `list`, `info`, `register` | [BareMetal.Expressions](BareMetal.Expressions.md) |
| [BareMetal.FileIo](BareMetal.FileIo.md) | `<script src="src/BareMetal.FileIO.js"></script>` | `destroy`, `open`, `save`, `dropZone`, `readAsText`, `pick`, `formatSize`, `slice`, `blobToArrayBuffer`, `hasFileSystemAccess` | [BareMetal.FileIo](BareMetal.FileIo.md) |
| [BareMetal.Font](BareMetal.Font.md) | `<script src="src/BareMetal.Font.js"></script>` | `el`, `get`, `set` | [BareMetal.Font](BareMetal.Font.md) |
| [BareMetal.Footerbar](BareMetal.Footerbar.md) | `<script src="src/BareMetal.FooterBar.js"></script>` | `el`, `setStatus`, `setTabs`, `setZoom`, `getZoom` | [BareMetal.Footerbar](BareMetal.Footerbar.md) |
| [BareMetal.Forms](BareMetal.Forms.md) | `<script src="src/BareMetal.Forms.js"></script>` | `destroy`, `create`, `getState`, `serialize`, `deserialize`, `validate`, `mask`, `wizard`, `repeater`, `autosave`, `conditional`, `submit`, `fromJSON`, `toFormData`, `diff`, `focus` | [BareMetal.Forms](BareMetal.Forms.md) |
| [BareMetal.Gallery](BareMetal.Gallery.md) | `<script src="src/BareMetal.Gallery.js"></script>` | `<module API>` | [BareMetal.Gallery](BareMetal.Gallery.md) |
| [BareMetal.Gamepad](BareMetal.Gamepad.md) | `<script src="src/BareMetal.Gamepad.js"></script>` | `<module API>` | [BareMetal.Gamepad](BareMetal.Gamepad.md) |
| [BareMetal.Geo](BareMetal.Geo.md) | `<script src="src/BareMetal.Geo.js"></script>` | `<module API>` | [BareMetal.Geo](BareMetal.Geo.md) |
| [BareMetal.Graph](BareMetal.Graph.md) | `<script src="src/BareMetal.Graph.js"></script>` | `xmlns`, `style`, `y`, `svg`, `simulation`, `nodes`, `edges` | [BareMetal.Graph](BareMetal.Graph.md) |
| [BareMetal.I18n](BareMetal.I18n.md) | `<script src="src/BareMetal.I18n.js"></script>` | `setLocale`, `getLocale`, `addMessages`, `t`, `loadMessages`, `isRTL`, `subscribe`, `configure` | [BareMetal.I18n](BareMetal.I18n.md) |
| [BareMetal.ID3](BareMetal.ID3.md) | `<script src="src/BareMetal.ID3.js"></script>` | `title`, `artist`, `album`, `year`, `comment`, `track`, `genre` | [BareMetal.ID3](BareMetal.ID3.md) |
| [BareMetal.IDB](BareMetal.IDB.md) | `<script src="src/BareMetal.IDB.js"></script>` | `set`, `get`, `delete`, `has`, `keys`, `clear`, `close` | [BareMetal.IDB](BareMetal.IDB.md) |
| BareMetal.Inbox | `<script src="src/BareMetal.Inbox.js"></script>` | `id`, `channel`, `title`, `body`, `data`, `priority`, `action`, `icon`, `group`, `read`, `timestamp`, `dismissed`, `pinned`, `summary`, `items` | BareMetal.Inbox |
| BareMetal.InputRouter | `<script src="src/BareMetal.InputRouter.js"></script>` | `<module API>` | BareMetal.InputRouter |
| [BareMetal.Integrity](BareMetal.Integrity.md) | `<script src="src/BareMetal.Integrity.js"></script>` | `sha256`, `verify`, `createManifest`, `verifyManifest` | [BareMetal.Integrity](BareMetal.Integrity.md) |
| [BareMetal.Launcher](BareMetal.Launcher.md) | `<script src="src/BareMetal.Launcher.js"></script>` | `createStore`, `createApi`, `createSocket`, `attachTerminal`, `renderSessionCards`, `createLauncher` | [BareMetal.Launcher](BareMetal.Launcher.md) |
| [BareMetal.LocalKvStore](BareMetal.LocalKvStore.md) | `<script src="src/BareMetal.LocalKVStore.js"></script>` | `get`, `set`, `remove`, `has`, `clear`, `allEntries`, `getRaw`, `setRaw` | [BareMetal.LocalKvStore](BareMetal.LocalKvStore.md) |
| [BareMetal.Logger](BareMetal.Logger.md) | `<script src="src/BareMetal.Logger.js"></script>` | `create`, `console`, `beacon` | [BareMetal.Logger](BareMetal.Logger.md) |
| [BareMetal.Markdown](BareMetal.Markdown.md) | `<script src="src/BareMetal.Markdown.js"></script>` | `meta`, `render`, `renderTo`, `renderSafe`, `createRenderer`, `toc`, `frontMatter`, `inline`, `escape` | [BareMetal.Markdown](BareMetal.Markdown.md) |
| [BareMetal.Media](BareMetal.Media.md) | `<script src="src/BareMetal.Media.js"></script>` | `<module API>` | [BareMetal.Media](BareMetal.Media.md) |
| [BareMetal.MermaidDiagramRenderer](BareMetal.MermaidDiagramRenderer.md) | `<script src="src/BareMetal.MermaidDiagramRenderer.js"></script>` | `<module API>` | [BareMetal.MermaidDiagramRenderer](BareMetal.MermaidDiagramRenderer.md) |
| [BareMetal.Metadata](BareMetal.Metadata.md) | `<script src="src/BareMetal.Metadata.js"></script>` | `register`, `get`, `list`, `remove`, `scanInline`, `fetchAndRegister`, `renderForm`, `renderTable`, `toTemplateFields`, `fromBinary` | [BareMetal.Metadata](BareMetal.Metadata.md) |
| [BareMetal.MIDI](BareMetal.MIDI.md) | `<script src="src/BareMetal.MIDI.js"></script>` | `request`, `onMessage`, `mapCC`, `mapPitchBend`, `getInputs`, `getOutputs`, `getDevices`, `send`, `destroy` | [BareMetal.MIDI](BareMetal.MIDI.md) |
| [BareMetal.MIDIProfiles](BareMetal.MIDIProfiles.md) | `<script src="src/BareMetal.MIDIProfiles.js"></script>` | `importJson`, `exportJson`, `activate`, `learn`, `cancelLearn`, `capture`, `resolveMessage`, `listProfiles`, `omnisDuoPlaceholder` | [BareMetal.MIDIProfiles](BareMetal.MIDIProfiles.md) |
| BareMetal.Minifier | `<script src="src/BareMetal.Minifier.js"></script>` | `end`, `minifyJS`, `minifyCSS`, `compressGzip`, `decompressGzip` | BareMetal.Minifier |
| [BareMetal.Modal](BareMetal.Modal.md) | `<script src="src/BareMetal.Modal.js"></script>` | `<module API>` | [BareMetal.Modal](BareMetal.Modal.md) |
| [BareMetal.ModuleLoader](BareMetal.ModuleLoader.md) | `<script src="src/BareMetal.ModuleLoader.js"></script>` | `<module API>` | [BareMetal.ModuleLoader](BareMetal.ModuleLoader.md) |
| [BareMetal.MP3](BareMetal.MP3.md) | `<script src="src/BareMetal.MP3.js"></script>` | `readTags`, `create`, `stream`, `loadCatalog` | [BareMetal.MP3](BareMetal.MP3.md) |
| [BareMetal.MP3Catalog](BareMetal.MP3Catalog.md) | `<script src="src/BareMetal.MP3Catalog.js"></script>` | `add`, `addMany`, `update`, `remove`, `get`, `list`, `search`, `clear`, `manifest`, `onChange` | [BareMetal.MP3Catalog](BareMetal.MP3Catalog.md) |
| [BareMetal.MusicPlayer](BareMetal.MusicPlayer.md) | `<script src="src/BareMetal.MusicPlayer.js"></script>` | `index`, `currentTime`, `volume`, `pitchBendSemitones`, `highDb`, `streaming` | [BareMetal.MusicPlayer](BareMetal.MusicPlayer.md) |
| [BareMetal.Notify](BareMetal.Notify.md) | `<script src="src/BareMetal.Notify.js"></script>` | `<module API>` | [BareMetal.Notify](BareMetal.Notify.md) |
| [BareMetal.Observe](BareMetal.Observe.md) | `<script src="src/BareMetal.Observe.js"></script>` | `<module API>` | [BareMetal.Observe](BareMetal.Observe.md) |
| [BareMetal.Pay](BareMetal.Pay.md) | `<script src="src/BareMetal.Pay.js"></script>` | `valid`, `canPay`, `request`, `card`, `googlePay`, `applePay`, `formatCurrency`, `cart`, `shipping`, `validate`, `abort`, `complete`, `retry` | [BareMetal.Pay](BareMetal.Pay.md) |
| [BareMetal.PicoScript](BareMetal.PicoScript.md) | `<script src="src/BareMetal.PicoScript.js"></script>` | `compile`, `compilePython`, `compileDebug`, `symbolize`, `VM`, `PicoCompress` | [BareMetal.PicoScript](BareMetal.PicoScript.md) |
| [BareMetal.Pipeline](BareMetal.Pipeline.md) | `<script src="src/BareMetal.Pipeline.js"></script>` | `create`, `stream`, `compose`, `series`, `parallel`, `waterfall`, `backpressure` | [BareMetal.Pipeline](BareMetal.Pipeline.md) |
| [BareMetal.Pivot](BareMetal.Pivot.md) | `<script src="src/BareMetal.Pivot.js"></script>` | `lab`, `el`, `compute`, `setRecords`, `state` | [BareMetal.Pivot](BareMetal.Pivot.md) |
| [BareMetal.Play](BareMetal.Play.md) | `<script src="src/BareMetal.Play.js"></script>` | `PACKS`, `freshState`, `matchConditions`, `applyEffects`, `entryNode`, `offeredChoices`, `fillText`, `withPersonaFacts`, `narratorOf`, `sceneText`, `slipsFor`, `fireTriggers`, `memoryClient`, `mount` | [BareMetal.Play](BareMetal.Play.md) |
| BareMetal.Print | `<script src="src/BareMetal.Print.js"></script>` | `subtotal`, `pageHeight`, `pageWidth`, `margins`, `headerHeight`, `footerHeight`, `render`, `paginate`, `print`, `preview`, `stylesheet`, `receipt`, `invoice`, `document`, `fromDocChain`, `grid`, `table`, `barcode`, `qr`, `label`, `header`, `footer`, `section`, `columns`, `image`, `spacer`, `_internals`, `tableHtml`, `barcodeSvg`, `qrSvg`, `qrMatrix`, `collectBlocks`, `htmlToThermalText` | BareMetal.Print |
| [BareMetal.Progressive](BareMetal.Progressive.md) | `<script src="src/BareMetal.Progressive.js"></script>` | `register`, `unregister`, `getRegistration`, `update`, `onInstallPrompt`, `isInstalled`, `isInstallable`, `precache`, `clearCache`, `getCacheStatus`, `isOnline`, `onConnectivityChange`, `requestSync`, `subscribePush`, `unsubscribePush`, `getPushSubscription`, `generateManifest`, `injectManifest`, `postMessage`, `onMessage` | [BareMetal.Progressive](BareMetal.Progressive.md) |
| [BareMetal.Pubsub](BareMetal.Pubsub.md) | `<script src="src/BareMetal.PubSub.js"></script>` | `emit`, `subscribe` | [BareMetal.Pubsub](BareMetal.Pubsub.md) |
| [BareMetal.RBAC](BareMetal.RBAC.md) | `<script src="src/BareMetal.RBAC.js"></script>` | `WARNING`, `configure`, `identity`, `isAuthenticated`, `hasRole`, `hasAnyRole`, `hasAllRoles`, `inGroup`, `inAnyGroup`, `inAllGroups`, `can`, `canAny`, `canAll`, `hasScope`, `hasAnyScope`, `check`, `checkAny`, `guard`, `applyDOM`, `setToken`, `clearToken`, `refresh`, `onExpiry`, `tenant`, `isTenant` | [BareMetal.RBAC](BareMetal.RBAC.md) |
| [BareMetal.Rendering](BareMetal.Rendering.md) | `<script src="src/BareMetal.Rendering.js"></script>` | `setRoot`, `createNewEntity`, `bind`, `state`, `listEntities` | [BareMetal.Rendering](BareMetal.Rendering.md) |
| [BareMetal.Ribbon](BareMetal.Ribbon.md) | `<script src="src/BareMetal.Ribbon.js"></script>` | `el`, `item`, `setActive`, `setDisabled`, `setColour`, `setFont` | [BareMetal.Ribbon](BareMetal.Ribbon.md) |
| [BareMetal.Routing](BareMetal.Routing.md) | `<script src="src/BareMetal.Routing.js"></script>` | `pathname`, `search` | [BareMetal.Routing](BareMetal.Routing.md) |
| BareMetal.Scan | `<script src="src/BareMetal.Scan.js"></script>` | `text`, `stop` | BareMetal.Scan |
| BareMetal.SceneInspector | `<script src="src/BareMetal.SceneInspector.js"></script>` | `<module API>` | BareMetal.SceneInspector |
| BareMetal.Schedule | `<script src="src/BareMetal.Schedule.js"></script>` | `cron`, `interval`, `delay`, `at`, `every`, `queue`, `scheduler`, `parseCron`, `nextCron`, `matchesCron`, `parseDuration`, `formatDuration`, `debounce`, `throttle`, `rateLimit`, `retry`, `deadline` | BareMetal.Schedule |
| [BareMetal.Schema](BareMetal.Schema.md) | `<script src="src/BareMetal.Schema.js"></script>` | `string`, `number`, `boolean`, `array`, `object`, `date`, `oneOf`, `nullable`, `optional`, `parse`, `validate`, `transform`, `coerce`, `defaults`, `extend`, `pick`, `omit`, `partial`, `version`, `toJSON`, `fromJSON`, `custom`, `toBinary`, `fromBinary` | [BareMetal.Schema](BareMetal.Schema.md) |
| BareMetal.Search | `<script src="src/BareMetal.Search.js"></script>` | `docCount`, `termCount`, `avgDocLength`, `indexSize` | BareMetal.Search |
| [BareMetal.SecureTransport](BareMetal.SecureTransport.md) | `<script src="src/BareMetal.SecureTransport.js"></script>` | `setPublicKey`, `loadPublicKey`, `encryptObject`, `decryptObject`, `fetch`, `getKeyId`, `getTunnelUrl` | [BareMetal.SecureTransport](BareMetal.SecureTransport.md) |
| [BareMetal.ServiceWorker](BareMetal.ServiceWorker.md) | `<script src="src/BareMetal.ServiceWorker.js"></script>` | `<module API>` | [BareMetal.ServiceWorker](BareMetal.ServiceWorker.md) |
| [BareMetal.Session](BareMetal.Session.md) | `<script src="src/BareMetal.Session.js"></script>` | `create`, `tabSync`, `guard`, `fingerprint`, `activity` | [BareMetal.Session](BareMetal.Session.md) |
| [BareMetal.Sheet](BareMetal.Sheet.md) | `<script src="src/BareMetal.Sheet.js"></script>` | `el`, `addr`, `parseAddr`, `getData`, `setData`, `getCell`, `setCell`, `select`, `selected`, `selectedRange`, `styleSelected`, `styleRange`, `mergeSelected`, `insertRow`, `deleteRow`, `insertCol`, `deleteCol`, `setRowFilter`, `unmergeSelected`, `startEdit` | [BareMetal.Sheet](BareMetal.Sheet.md) |
| [BareMetal.Speech](BareMetal.Speech.md) | `<script src="src/BareMetal.Speech.js"></script>` | `<module API>` | [BareMetal.Speech](BareMetal.Speech.md) |
| [BareMetal.StateMachine](BareMetal.StateMachine.md) | `<script src="src/BareMetal.StateMachine.js"></script>` | `send`, `getState`, `getContext`, `matches`, `subscribe` | [BareMetal.StateMachine](BareMetal.StateMachine.md) |
| [BareMetal.Story](BareMetal.Story.md) | `<script src="src/BareMetal.Story.js"></script>` | `PACKS`, `validateConditions`, `validateEffects`, `validateTriggers`, `validateBaseFacts`, `graphData`, `memoryClient`, `mount` | [BareMetal.Story](BareMetal.Story.md) |
| [BareMetal.Sync](BareMetal.Sync.md) | `<script src="src/BareMetal.Sync.js"></script>` | `diff`, `patch`, `merge`, `conflict`, `resolve`, `queue`, `replay`, `echo`, `clock`, `crdt`, `version`, `subscribe`, `batch` | [BareMetal.Sync](BareMetal.Sync.md) |
| BareMetal.Tabs | `<script src="src/BareMetal.Tabs.js"></script>` | `<module API>` | BareMetal.Tabs |
| [BareMetal.Template](BareMetal.Template.md) | `<script src="src/BareMetal.Template.js"></script>` | `<module API>` | [BareMetal.Template](BareMetal.Template.md) |
| BareMetal.Tenant | `<script src="src/BareMetal.Tenant.js"></script>` | `create`, `current`, `scope`, `middleware`, `store`, `add`, `get`, `remove`, `list`, `find`, `count`, `config`, `isolate`, `partition`, `hierarchy`, `limits`, `features`, `onSwitch`, `onChange`, `impersonate`, `export`, `import`, `resolve`, `seal`, `suspend`, `activate` | BareMetal.Tenant |
| [BareMetal.TestRunner](BareMetal.TestRunner.md) | `<script src="src/BareMetal.TestRunner.js"></script>` | `ok`, `status`, `url`, `headers`, `json`, `text`, `clone` | [BareMetal.TestRunner](BareMetal.TestRunner.md) |
| BareMetal.ThemePicker | `<script src="src/BareMetal.ThemePicker.js"></script>` | `<module API>` | BareMetal.ThemePicker |
| [BareMetal.Time](BareMetal.Time.md) | `<script src="src/BareMetal.Time.js"></script>` | `days`, `timeZone`, `hour`, `fractionalSecondDigits`, `now`, `format`, `add`, `isBefore`, `diff`, `daysInMonth`, `dayOfWeek`, `toTimezone`, `hasTemporal` | [BareMetal.Time](BareMetal.Time.md) |
| BareMetal.Timeline | `<script src="src/BareMetal.Timeline.js"></script>` | `<module API>` | BareMetal.Timeline |
| [BareMetal.Tokens](BareMetal.Tokens.md) | `<script src="src/BareMetal.Tokens.js"></script>` | `sign`, `signSync`, `decode`, `verify`, `isExpired`, `expiresIn`, `claim`, `generateSecret`, `generateKeyPair`, `importKey`, `exportKey`, `importJWK`, `create`, `parseDuration`, `toBase64Url`, `fromBase64Url` | [BareMetal.Tokens](BareMetal.Tokens.md) |
| [BareMetal.Transport](BareMetal.Transport.md) | `<script src="src/BareMetal.Transport.js"></script>` | `retry`, `backoff`, `idempotencyKey`, `dedupe`, `coalesce`, `cancel`, `timeout`, `fetchWithTimeout`, `fetchWithRetry`, `race`, `cache`, `priority`, `queue`, `circuit`, `rateLimit` | [BareMetal.Transport](BareMetal.Transport.md) |
| [BareMetal.Types](BareMetal.Types.md) | `<script src="src/BareMetal.Types.js"></script>` | `name`, `fields`, `methods`, `ancestors`, `serializable` | [BareMetal.Types](BareMetal.Types.md) |
| [BareMetal.UndoRedo](BareMetal.UndoRedo.md) | `<script src="src/BareMetal.UndoRedo.js"></script>` | `<module API>` | [BareMetal.UndoRedo](BareMetal.UndoRedo.md) |
| [BareMetal.URL](BareMetal.URL.md) | `<script src="src/BareMetal.URL.js"></script>` | `parse`, `build`, `query`, `encode`, `decode`, `merge`, `remove`, `params`, `template`, `join`, `normalize`, `isAbsolute`, `isRelative`, `resolve`, `compare`, `slug`, `hash`, `get`, `set`, `origin`, `isValid`, `relative` | [BareMetal.URL](BareMetal.URL.md) |
| [BareMetal.Validate](BareMetal.Validate.md) | `<script src="src/BareMetal.Validate.js"></script>` | `<module API>` | [BareMetal.Validate](BareMetal.Validate.md) |
| BareMetal.Vector | `<script src="src/BareMetal.Vector.js"></script>` | `createCollection`, `upsert`, `remove`, `count`, `search`, `clear` | BareMetal.Vector |
| BareMetal.Vectorsearch | `<script src="src/BareMetal.VectorSearch.js"></script>` | `upsert`, `remove`, `has`, `get`, `size`, `clear`, `topK`, `dims` | BareMetal.Vectorsearch |
| [BareMetal.VTTerminal](BareMetal.VTTerminal.md) | `<script src="src/BareMetal.VTTerminal.js"></script>` | `element`, `write`, `clear`, `resize`, `send`, `openWebSocket`, `onInput`, `getLines`, `destroy` | [BareMetal.VTTerminal](BareMetal.VTTerminal.md) |
| [BareMetal.Workers](BareMetal.Workers.md) | `<script src="src/BareMetal.Workers.js"></script>` | `<module API>` | [BareMetal.Workers](BareMetal.Workers.md) |
| [BareMetal.Workflow](BareMetal.Workflow.md) | `<script src="src/BareMetal.Workflow.js"></script>` | `VERSION`, `create`, `mount`, `parseTree`, `serialize`, `WORKFLOW_TYPES` | [BareMetal.Workflow](BareMetal.Workflow.md) |

## BareMetal.3DXR

```html
<script src="src/BareMetal.3DXR.js"></script>
```

```js
const moduleApi = BareMetal.3DXR;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: VERSION
if (typeof instance.VERSION === 'function') {
  // const result = instance.VERSION(/* arguments */);
}
// Public function: create
if (typeof instance.create === 'function') {
  // const result = instance.create(/* arguments */);
}
// Public function: isSupported
if (typeof instance.isSupported === 'function') {
  // const result = instance.isSupported(/* arguments */);
}
```

Implementation guide: [BareMetal.3DXR.md](BareMetal.3DXR.md)

## BareMetal.A11y

```html
<script src="src/BareMetal.A11y.js"></script>
```

```js
const moduleApi = BareMetal.A11y;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: focusTrap
if (typeof instance.focusTrap === 'function') {
  // const result = instance.focusTrap(/* arguments */);
}
// Public function: announce
if (typeof instance.announce === 'function') {
  // const result = instance.announce(/* arguments */);
}
// Public function: skipNav
if (typeof instance.skipNav === 'function') {
  // const result = instance.skipNav(/* arguments */);
}
// Public function: roving
if (typeof instance.roving === 'function') {
  // const result = instance.roving(/* arguments */);
}
// Public function: prefersReducedMotion
if (typeof instance.prefersReducedMotion === 'function') {
  // const result = instance.prefersReducedMotion(/* arguments */);
}
// Public function: prefersColorScheme
if (typeof instance.prefersColorScheme === 'function') {
  // const result = instance.prefersColorScheme(/* arguments */);
}
// Public function: onMotionChange
if (typeof instance.onMotionChange === 'function') {
  // const result = instance.onMotionChange(/* arguments */);
}
// Public function: onSchemeChange
if (typeof instance.onSchemeChange === 'function') {
  // const result = instance.onSchemeChange(/* arguments */);
}
```

Implementation guide: [BareMetal.A11y.md](BareMetal.A11y.md)

## BareMetal.Animate

```html
<script src="src/BareMetal.Animate.js"></script>
```

```js
const moduleApi = BareMetal.Animate;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: enter
if (typeof instance.enter === 'function') {
  // const result = instance.enter(/* arguments */);
}
// Public function: leave
if (typeof instance.leave === 'function') {
  // const result = instance.leave(/* arguments */);
}
// Public function: toggle
if (typeof instance.toggle === 'function') {
  // const result = instance.toggle(/* arguments */);
}
// Public function: move
if (typeof instance.move === 'function') {
  // const result = instance.move(/* arguments */);
}
// Public function: list
if (typeof instance.list === 'function') {
  // const result = instance.list(/* arguments */);
}
// Public function: prefersReducedMotion
if (typeof instance.prefersReducedMotion === 'function') {
  // const result = instance.prefersReducedMotion(/* arguments */);
}
```

Implementation guide: [BareMetal.Animate.md](BareMetal.Animate.md)

## BareMetal.AudioMixer

```html
<script src="src/BareMetal.AudioMixer.js"></script>
```

```js
const moduleApi = BareMetal.AudioMixer;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```


## BareMetal.Auth

```html
<script src="src/BareMetal.Auth.js"></script>
```

```js
const moduleApi = BareMetal.Auth;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: configure
if (typeof instance.configure === 'function') {
  // const result = instance.configure(/* arguments */);
}
// Public function: initialize
if (typeof instance.initialize === 'function') {
  // const result = instance.initialize(/* arguments */);
}
// Public function: login
if (typeof instance.login === 'function') {
  // const result = instance.login(/* arguments */);
}
// Public function: handleCallback
if (typeof instance.handleCallback === 'function') {
  // const result = instance.handleCallback(/* arguments */);
}
// Public function: logout
if (typeof instance.logout === 'function') {
  // const result = instance.logout(/* arguments */);
}
// Public function: clearSession
if (typeof instance.clearSession === 'function') {
  // const result = instance.clearSession(/* arguments */);
}
// Public function: getToken
if (typeof instance.getToken === 'function') {
  // const result = instance.getToken(/* arguments */);
}
// Public function: getIdToken
if (typeof instance.getIdToken === 'function') {
  // const result = instance.getIdToken(/* arguments */);
}
// Public function: silentRefresh
if (typeof instance.silentRefresh === 'function') {
  // const result = instance.silentRefresh(/* arguments */);
}
// Public function: handleSilentCallback
if (typeof instance.handleSilentCallback === 'function') {
  // const result = instance.handleSilentCallback(/* arguments */);
}
// Public function: getUser
if (typeof instance.getUser === 'function') {
  // const result = instance.getUser(/* arguments */);
}
// Public function: getUserInfo
if (typeof instance.getUserInfo === 'function') {
  // const result = instance.getUserInfo(/* arguments */);
}
// Public function: isAuthenticated
if (typeof instance.isAuthenticated === 'function') {
  // const result = instance.isAuthenticated(/* arguments */);
}
// Public function: onAuthChange
if (typeof instance.onAuthChange === 'function') {
  // const result = instance.onAuthChange(/* arguments */);
}
// Public function: attachToRest
if (typeof instance.attachToRest === 'function') {
  // const result = instance.attachToRest(/* arguments */);
}
// Public function: _setRedirect
if (typeof instance._setRedirect === 'function') {
  // const result = instance._setRedirect(/* arguments */);
}
// Public function: parseJwt
if (typeof instance.parseJwt === 'function') {
  // const result = instance.parseJwt(/* arguments */);
}
// Public function: createPkce
if (typeof instance.createPkce === 'function') {
  // const result = instance.createPkce(/* arguments */);
}
// Public function: decodeJwtParts
if (typeof instance.decodeJwtParts === 'function') {
  // const result = instance.decodeJwtParts(/* arguments */);
}
// Public function: renderLogin
if (typeof instance.renderLogin === 'function') {
  // const result = instance.renderLogin(/* arguments */);
}
// Public function: renderLogout
if (typeof instance.renderLogout === 'function') {
  // const result = instance.renderLogout(/* arguments */);
}
// Public function: renderWhoami
if (typeof instance.renderWhoami === 'function') {
  // const result = instance.renderWhoami(/* arguments */);
}
// Public function: renderTokenInspector
if (typeof instance.renderTokenInspector === 'function') {
  // const result = instance.renderTokenInspector(/* arguments */);
}
// Public function: renderUserTiles
if (typeof instance.renderUserTiles === 'function') {
  // const result = instance.renderUserTiles(/* arguments */);
}
// Public function: renderAuthGate
if (typeof instance.renderAuthGate === 'function') {
  // const result = instance.renderAuthGate(/* arguments */);
}
```

Implementation guide: [BareMetal.Auth.md](BareMetal.Auth.md)

## BareMetal.Authenticator

```html
<script src="src/BareMetal.Authenticator.js"></script>
```

```js
const moduleApi = BareMetal.Authenticator;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: setup
if (typeof instance.setup === 'function') {
  // const result = instance.setup(/* arguments */);
}
// Public function: verify
if (typeof instance.verify === 'function') {
  // const result = instance.verify(/* arguments */);
}
// Public function: generate
if (typeof instance.generate === 'function') {
  // const result = instance.generate(/* arguments */);
}
// Public function: challenge
if (typeof instance.challenge === 'function') {
  // const result = instance.challenge(/* arguments */);
}
// Public function: protect
if (typeof instance.protect === 'function') {
  // const result = instance.protect(/* arguments */);
}
// Public function: lastVerified
if (typeof instance.lastVerified === 'function') {
  // const result = instance.lastVerified(/* arguments */);
}
// Public function: timeSinceVerify
if (typeof instance.timeSinceVerify === 'function') {
  // const result = instance.timeSinceVerify(/* arguments */);
}
// Public function: replayGuard
if (typeof instance.replayGuard === 'function') {
  // const result = instance.replayGuard(/* arguments */);
}
// Public function: backupVerify
if (typeof instance.backupVerify === 'function') {
  // const result = instance.backupVerify(/* arguments */);
}
// Public function: qrSvg
if (typeof instance.qrSvg === 'function') {
  // const result = instance.qrSvg(/* arguments */);
}
// Public function: base32encode
if (typeof instance.base32encode === 'function') {
  // const result = instance.base32encode(/* arguments */);
}
// Public function: base32decode
if (typeof instance.base32decode === 'function') {
  // const result = instance.base32decode(/* arguments */);
}
// Public function: hmacSha1
if (typeof instance.hmacSha1 === 'function') {
  // const result = instance.hmacSha1(/* arguments */);
}
// Public function: hotp
if (typeof instance.hotp === 'function') {
  // const result = instance.hotp(/* arguments */);
}
// Public function: totp
if (typeof instance.totp === 'function') {
  // const result = instance.totp(/* arguments */);
}
// Public function: policy
if (typeof instance.policy === 'function') {
  // const result = instance.policy(/* arguments */);
}
// Public function: events
if (typeof instance.events === 'function') {
  // const result = instance.events(/* arguments */);
}
// Public function: onSetup
if (typeof instance.onSetup === 'function') {
  // const result = instance.onSetup(/* arguments */);
}
// Public function: onVerify
if (typeof instance.onVerify === 'function') {
  // const result = instance.onVerify(/* arguments */);
}
// Public function: onFail
if (typeof instance.onFail === 'function') {
  // const result = instance.onFail(/* arguments */);
}
// Public function: onChallenge
if (typeof instance.onChallenge === 'function') {
  // const result = instance.onChallenge(/* arguments */);
}
```


## BareMetal.Binary

```html
<script src="src/BareMetal.Binary.js"></script>
```

```js
const moduleApi = BareMetal.Binary;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: setSigningKey
if (typeof instance.setSigningKey === 'function') {
  // const result = instance.setSigningKey(/* arguments */);
}
// Public function: deserialize
if (typeof instance.deserialize === 'function') {
  // const result = instance.deserialize(/* arguments */);
}
// Public function: fetchLayout
if (typeof instance.fetchLayout === 'function') {
  // const result = instance.fetchLayout(/* arguments */);
}
// Public function: SpanReader
if (typeof instance.SpanReader === 'function') {
  // const result = instance.SpanReader(/* arguments */);
}
```

Implementation guide: [BareMetal.Binary.md](BareMetal.Binary.md)

## BareMetal.Bind

```html
<script src="src/BareMetal.Bind.js"></script>
```

```js
const moduleApi = BareMetal.Bind;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: reactive
if (typeof instance.reactive === 'function') {
  // const result = instance.reactive(/* arguments */);
}
// Public function: getPath
if (typeof instance.getPath === 'function') {
  // const result = instance.getPath(/* arguments */);
}
// Public function: resolveInScope
if (typeof instance.resolveInScope === 'function') {
  // const result = instance.resolveInScope(/* arguments */);
}
// Public function: appendList
if (typeof instance.appendList === 'function') {
  // const result = instance.appendList(/* arguments */);
}
```

Implementation guide: [BareMetal.Bind.md](BareMetal.Bind.md)

## BareMetal.Blob

```html
<script src="src/BareMetal.Blob.js"></script>
```

```js
const moduleApi = BareMetal.Blob;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: usage
if (typeof instance.usage === 'function') {
  // const result = instance.usage(/* arguments */);
}
// Public function: create
if (typeof instance.create === 'function') {
  // const result = instance.create(/* arguments */);
}
// Public function: chunk
if (typeof instance.chunk === 'function') {
  // const result = instance.chunk(/* arguments */);
}
// Public function: upload
if (typeof instance.upload === 'function') {
  // const result = instance.upload(/* arguments */);
}
// Public function: resume
if (typeof instance.resume === 'function') {
  // const result = instance.resume(/* arguments */);
}
// Public function: download
if (typeof instance.download === 'function') {
  // const result = instance.download(/* arguments */);
}
// Public function: hash
if (typeof instance.hash === 'function') {
  // const result = instance.hash(/* arguments */);
}
// Public function: store
if (typeof instance.store === 'function') {
  // const result = instance.store(/* arguments */);
}
// Public function: lifecycle
if (typeof instance.lifecycle === 'function') {
  // const result = instance.lifecycle(/* arguments */);
}
// Public function: transform
if (typeof instance.transform === 'function') {
  // const result = instance.transform(/* arguments */);
}
// Public function: encrypt
if (typeof instance.encrypt === 'function') {
  // const result = instance.encrypt(/* arguments */);
}
// Public function: decrypt
if (typeof instance.decrypt === 'function') {
  // const result = instance.decrypt(/* arguments */);
}
// Public function: compress
if (typeof instance.compress === 'function') {
  // const result = instance.compress(/* arguments */);
}
// Public function: decompress
if (typeof instance.decompress === 'function') {
  // const result = instance.decompress(/* arguments */);
}
// Public function: toDataURL
if (typeof instance.toDataURL === 'function') {
  // const result = instance.toDataURL(/* arguments */);
}
// Public function: fromDataURL
if (typeof instance.fromDataURL === 'function') {
  // const result = instance.fromDataURL(/* arguments */);
}
// Public function: toBase64
if (typeof instance.toBase64 === 'function') {
  // const result = instance.toBase64(/* arguments */);
}
// Public function: fromBase64
if (typeof instance.fromBase64 === 'function') {
  // const result = instance.fromBase64(/* arguments */);
}
// Public function: slice
if (typeof instance.slice === 'function') {
  // const result = instance.slice(/* arguments */);
}
// Public function: concat
if (typeof instance.concat === 'function') {
  // const result = instance.concat(/* arguments */);
}
// Public function: diff
if (typeof instance.diff === 'function') {
  // const result = instance.diff(/* arguments */);
}
// Public function: fingerprint
if (typeof instance.fingerprint === 'function') {
  // const result = instance.fingerprint(/* arguments */);
}
// Public function: quota
if (typeof instance.quota === 'function') {
  // const result = instance.quota(/* arguments */);
}
```


## BareMetal.Cache

```html
<script src="src/BareMetal.Cache.js"></script>
```

```js
const moduleApi = BareMetal.Cache;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: get
if (typeof instance.get === 'function') {
  // const result = instance.get(/* arguments */);
}
// Public function: set
if (typeof instance.set === 'function') {
  // const result = instance.set(/* arguments */);
}
// Public function: has
if (typeof instance.has === 'function') {
  // const result = instance.has(/* arguments */);
}
// Public function: delete
if (typeof instance.delete === 'function') {
  // const result = instance.delete(/* arguments */);
}
// Public function: clear
if (typeof instance.clear === 'function') {
  // const result = instance.clear(/* arguments */);
}
// Public function: size
if (typeof instance.size === 'function') {
  // const result = instance.size(/* arguments */);
}
// Public function: keys
if (typeof instance.keys === 'function') {
  // const result = instance.keys(/* arguments */);
}
// Public function: entries
if (typeof instance.entries === 'function') {
  // const result = instance.entries(/* arguments */);
}
// Public function: wrap
if (typeof instance.wrap === 'function') {
  // const result = instance.wrap(/* arguments */);
}
// Public function: invalidate
if (typeof instance.invalidate === 'function') {
  // const result = instance.invalidate(/* arguments */);
}
// Public function: invalidateByTag
if (typeof instance.invalidateByTag === 'function') {
  // const result = instance.invalidateByTag(/* arguments */);
}
// Public function: prune
if (typeof instance.prune === 'function') {
  // const result = instance.prune(/* arguments */);
}
// Public function: stats
if (typeof instance.stats === 'function') {
  // const result = instance.stats(/* arguments */);
}
// Public function: hits
if (typeof instance.hits === 'function') {
  // const result = instance.hits(/* arguments */);
}
// Public function: misses
if (typeof instance.misses === 'function') {
  // const result = instance.misses(/* arguments */);
}
// Public function: hitRate
if (typeof instance.hitRate === 'function') {
  // const result = instance.hitRate(/* arguments */);
}
// Public function: evictions
if (typeof instance.evictions === 'function') {
  // const result = instance.evictions(/* arguments */);
}
```

Implementation guide: [BareMetal.Cache.md](BareMetal.Cache.md)

## BareMetal.Capabilities

```html
<script src="src/BareMetal.Capabilities.js"></script>
```

```js
const moduleApi = BareMetal.Capabilities;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: compatible
if (typeof instance.compatible === 'function') {
  // const result = instance.compatible(/* arguments */);
}
// Public function: missing
if (typeof instance.missing === 'function') {
  // const result = instance.missing(/* arguments */);
}
// Public function: optional
if (typeof instance.optional === 'function') {
  // const result = instance.optional(/* arguments */);
}
```

Implementation guide: [BareMetal.Capabilities.md](BareMetal.Capabilities.md)

## BareMetal.Charts

```html
<script src="src/BareMetal.Charts.js"></script>
```

```js
const moduleApi = BareMetal.Charts;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Charts.md](BareMetal.Charts.md)

## BareMetal.Clipboard

```html
<script src="src/BareMetal.Clipboard.js"></script>
```

```js
const moduleApi = BareMetal.Clipboard;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Clipboard.md](BareMetal.Clipboard.md)

## BareMetal.Codes

```html
<script src="src/BareMetal.Codes.js"></script>
```

```js
const moduleApi = BareMetal.Codes;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Codes.md](BareMetal.Codes.md)

## BareMetal.Colour

```html
<script src="src/BareMetal.Colour.js"></script>
```

```js
const moduleApi = BareMetal.Colour;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: el
if (typeof instance.el === 'function') {
  // const result = instance.el(/* arguments */);
}
// Public function: get
if (typeof instance.get === 'function') {
  // const result = instance.get(/* arguments */);
}
// Public function: set
if (typeof instance.set === 'function') {
  // const result = instance.set(/* arguments */);
}
// Public function: open
if (typeof instance.open === 'function') {
  // const result = instance.open(/* arguments */);
}
// Public function: close
if (typeof instance.close === 'function') {
  // const result = instance.close(/* arguments */);
}
```

Implementation guide: [BareMetal.Colour.md](BareMetal.Colour.md)

## BareMetal.Communications

```html
<script src="src/BareMetal.Communications.js"></script>
```

```js
const moduleApi = BareMetal.Communications;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: records
if (typeof instance.records === 'function') {
  // const result = instance.records(/* arguments */);
}
// Public function: setRoot
if (typeof instance.setRoot === 'function') {
  // const result = instance.setRoot(/* arguments */);
}
// Public function: connectWs
if (typeof instance.connectWs === 'function') {
  // const result = instance.connectWs(/* arguments */);
}
// Public function: setSecureTransport
if (typeof instance.setSecureTransport === 'function') {
  // const result = instance.setSecureTransport(/* arguments */);
}
```

Implementation guide: [BareMetal.Communications.md](BareMetal.Communications.md)

## BareMetal.ComponentFactories

```html
<script src="src/BareMetal.ComponentFactories.js"></script>
```

```js
const moduleApi = BareMetal.ComponentFactories;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.ComponentFactories.md](BareMetal.ComponentFactories.md)

## BareMetal.Components

```html
<script src="src/BareMetal.Components.js"></script>
```

```js
const moduleApi = BareMetal.Components;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: header
if (typeof instance.header === 'function') {
  // const result = instance.header(/* arguments */);
}
```

Implementation guide: [BareMetal.Components.md](BareMetal.Components.md)

## BareMetal.Compress

```html
<script src="src/BareMetal.Compress.js"></script>
```

```js
const moduleApi = BareMetal.Compress;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Compress.md](BareMetal.Compress.md)

## BareMetal.Config

```html
<script src="src/BareMetal.Config.js"></script>
```

```js
const moduleApi = BareMetal.Config;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: create
if (typeof instance.create === 'function') {
  // const result = instance.create(/* arguments */);
}
// Public function: priorities
if (typeof instance.priorities === 'function') {
  // const result = instance.priorities(/* arguments */);
}
```

Implementation guide: [BareMetal.Config.md](BareMetal.Config.md)

## BareMetal.Controls

```html
<script src="src/BareMetal.Controls.js"></script>
```

```js
const moduleApi = BareMetal.Controls;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Controls.md](BareMetal.Controls.md)

## BareMetal.ControlSurface

```html
<script src="src/BareMetal.ControlSurface.js"></script>
```

```js
const moduleApi = BareMetal.ControlSurface;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```


## BareMetal.Crypto

```html
<script src="src/BareMetal.Crypto.js"></script>
```

```js
const moduleApi = BareMetal.Crypto;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: name
if (typeof instance.name === 'function') {
  // const result = instance.name(/* arguments */);
}
// Public function: modulusLength
if (typeof instance.modulusLength === 'function') {
  // const result = instance.modulusLength(/* arguments */);
}
// Public function: publicExponent
if (typeof instance.publicExponent === 'function') {
  // const result = instance.publicExponent(/* arguments */);
}
// Public function: hash
if (typeof instance.hash === 'function') {
  // const result = instance.hash(/* arguments */);
}
// Public function: default
if (typeof instance.default === 'function') {
  // const result = instance.default(/* arguments */);
}
// Public function: iv
if (typeof instance.iv === 'function') {
  // const result = instance.iv(/* arguments */);
}
// Public function: baseKey
if (typeof instance.baseKey === 'function') {
  // const result = instance.baseKey(/* arguments */);
}
// Public function: generateSymmetricKey
if (typeof instance.generateSymmetricKey === 'function') {
  // const result = instance.generateSymmetricKey(/* arguments */);
}
// Public function: generateAsymmetricKey
if (typeof instance.generateAsymmetricKey === 'function') {
  // const result = instance.generateAsymmetricKey(/* arguments */);
}
// Public function: digest
if (typeof instance.digest === 'function') {
  // const result = instance.digest(/* arguments */);
}
// Public function: generateSigningKey
if (typeof instance.generateSigningKey === 'function') {
  // const result = instance.generateSigningKey(/* arguments */);
}
// Public function: exportKey
if (typeof instance.exportKey === 'function') {
  // const result = instance.exportKey(/* arguments */);
}
// Public function: toBase64Url
if (typeof instance.toBase64Url === 'function') {
  // const result = instance.toBase64Url(/* arguments */);
}
```

Implementation guide: [BareMetal.Crypto.md](BareMetal.Crypto.md)

## BareMetal.Diagnostics

```html
<script src="src/BareMetal.Diagnostics.js"></script>
```

```js
const moduleApi = BareMetal.Diagnostics;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: trace
if (typeof instance.trace === 'function') {
  // const result = instance.trace(/* arguments */);
}
// Public function: span
if (typeof instance.span === 'function') {
  // const result = instance.span(/* arguments */);
}
// Public function: timeline
if (typeof instance.timeline === 'function') {
  // const result = instance.timeline(/* arguments */);
}
// Public function: inspect
if (typeof instance.inspect === 'function') {
  // const result = instance.inspect(/* arguments */);
}
// Public function: why
if (typeof instance.why === 'function') {
  // const result = instance.why(/* arguments */);
}
// Public function: watch
if (typeof instance.watch === 'function') {
  // const result = instance.watch(/* arguments */);
}
// Public function: perf
if (typeof instance.perf === 'function') {
  // const result = instance.perf(/* arguments */);
}
// Public function: counter
if (typeof instance.counter === 'function') {
  // const result = instance.counter(/* arguments */);
}
// Public function: gauge
if (typeof instance.gauge === 'function') {
  // const result = instance.gauge(/* arguments */);
}
// Public function: report
if (typeof instance.report === 'function') {
  // const result = instance.report(/* arguments */);
}
// Public function: enable
if (typeof instance.enable === 'function') {
  // const result = instance.enable(/* arguments */);
}
// Public function: disable
if (typeof instance.disable === 'function') {
  // const result = instance.disable(/* arguments */);
}
// Public function: hook
if (typeof instance.hook === 'function') {
  // const result = instance.hook(/* arguments */);
}
```

Implementation guide: [BareMetal.Diagnostics.md](BareMetal.Diagnostics.md)

## BareMetal.DJDeck

```html
<script src="src/BareMetal.DJDeck.js"></script>
```

```js
const moduleApi = BareMetal.DJDeck;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: audio
if (typeof instance.audio === 'function') {
  // const result = instance.audio(/* arguments */);
}
// Public function: loadFile
if (typeof instance.loadFile === 'function') {
  // const result = instance.loadFile(/* arguments */);
}
// Public function: loadUrl
if (typeof instance.loadUrl === 'function') {
  // const result = instance.loadUrl(/* arguments */);
}
// Public function: play
if (typeof instance.play === 'function') {
  // const result = instance.play(/* arguments */);
}
// Public function: pause
if (typeof instance.pause === 'function') {
  // const result = instance.pause(/* arguments */);
}
// Public function: cue
if (typeof instance.cue === 'function') {
  // const result = instance.cue(/* arguments */);
}
// Public function: setCuePoint
if (typeof instance.setCuePoint === 'function') {
  // const result = instance.setCuePoint(/* arguments */);
}
// Public function: setHotCue
if (typeof instance.setHotCue === 'function') {
  // const result = instance.setHotCue(/* arguments */);
}
// Public function: jumpHotCue
if (typeof instance.jumpHotCue === 'function') {
  // const result = instance.jumpHotCue(/* arguments */);
}
// Public function: seek
if (typeof instance.seek === 'function') {
  // const result = instance.seek(/* arguments */);
}
// Public function: nudge
if (typeof instance.nudge === 'function') {
  // const result = instance.nudge(/* arguments */);
}
// Public function: setPitch
if (typeof instance.setPitch === 'function') {
  // const result = instance.setPitch(/* arguments */);
}
// Public function: setTempo
if (typeof instance.setTempo === 'function') {
  // const result = instance.setTempo(/* arguments */);
}
// Public function: setLoop
if (typeof instance.setLoop === 'function') {
  // const result = instance.setLoop(/* arguments */);
}
// Public function: getLoop
if (typeof instance.getLoop === 'function') {
  // const result = instance.getLoop(/* arguments */);
}
// Public function: sync
if (typeof instance.sync === 'function') {
  // const result = instance.sync(/* arguments */);
}
// Public function: state
if (typeof instance.state === 'function') {
  // const result = instance.state(/* arguments */);
}
// Public function: onChange
if (typeof instance.onChange === 'function') {
  // const result = instance.onChange(/* arguments */);
}
// Public function: destroy
if (typeof instance.destroy === 'function') {
  // const result = instance.destroy(/* arguments */);
}
```

Implementation guide: [BareMetal.DJDeck.md](BareMetal.DJDeck.md)

## BareMetal.DJLibrary

```html
<script src="src/BareMetal.DJLibrary.js"></script>
```

```js
const moduleApi = BareMetal.DJLibrary;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: saveTrack
if (typeof instance.saveTrack === 'function') {
  // const result = instance.saveTrack(/* arguments */);
}
// Public function: getTrack
if (typeof instance.getTrack === 'function') {
  // const result = instance.getTrack(/* arguments */);
}
// Public function: listTracks
if (typeof instance.listTracks === 'function') {
  // const result = instance.listTracks(/* arguments */);
}
// Public function: deleteTrack
if (typeof instance.deleteTrack === 'function') {
  // const result = instance.deleteTrack(/* arguments */);
}
// Public function: search
if (typeof instance.search === 'function') {
  // const result = instance.search(/* arguments */);
}
// Public function: saveCues
if (typeof instance.saveCues === 'function') {
  // const result = instance.saveCues(/* arguments */);
}
// Public function: getCues
if (typeof instance.getCues === 'function') {
  // const result = instance.getCues(/* arguments */);
}
// Public function: savePlaylist
if (typeof instance.savePlaylist === 'function') {
  // const result = instance.savePlaylist(/* arguments */);
}
// Public function: getPlaylist
if (typeof instance.getPlaylist === 'function') {
  // const result = instance.getPlaylist(/* arguments */);
}
// Public function: saveSetting
if (typeof instance.saveSetting === 'function') {
  // const result = instance.saveSetting(/* arguments */);
}
// Public function: getSetting
if (typeof instance.getSetting === 'function') {
  // const result = instance.getSetting(/* arguments */);
}
```

Implementation guide: [BareMetal.DJLibrary.md](BareMetal.DJLibrary.md)

## BareMetal.DJMixer

```html
<script src="src/BareMetal.DJMixer.js"></script>
```

```js
const moduleApi = BareMetal.DJMixer;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: context
if (typeof instance.context === 'function') {
  // const result = instance.context(/* arguments */);
}
// Public function: addChannel
if (typeof instance.addChannel === 'function') {
  // const result = instance.addChannel(/* arguments */);
}
// Public function: setChannel
if (typeof instance.setChannel === 'function') {
  // const result = instance.setChannel(/* arguments */);
}
// Public function: setCrossfader
if (typeof instance.setCrossfader === 'function') {
  // const result = instance.setCrossfader(/* arguments */);
}
// Public function: setPitch
if (typeof instance.setPitch === 'function') {
  // const result = instance.setPitch(/* arguments */);
}
// Public function: setPitchBend
if (typeof instance.setPitchBend === 'function') {
  // const result = instance.setPitchBend(/* arguments */);
}
// Public function: setMasterGain
if (typeof instance.setMasterGain === 'function') {
  // const result = instance.setMasterGain(/* arguments */);
}
// Public function: setCrossfaderCurve
if (typeof instance.setCrossfaderCurve === 'function') {
  // const result = instance.setCrossfaderCurve(/* arguments */);
}
// Public function: setLimiter
if (typeof instance.setLimiter === 'function') {
  // const result = instance.setLimiter(/* arguments */);
}
// Public function: setCue
if (typeof instance.setCue === 'function') {
  // const result = instance.setCue(/* arguments */);
}
// Public function: toggleCue
if (typeof instance.toggleCue === 'function') {
  // const result = instance.toggleCue(/* arguments */);
}
// Public function: setCueGain
if (typeof instance.setCueGain === 'function') {
  // const result = instance.setCueGain(/* arguments */);
}
// Public function: setPreviewMix
if (typeof instance.setPreviewMix === 'function') {
  // const result = instance.setPreviewMix(/* arguments */);
}
// Public function: getCueState
if (typeof instance.getCueState === 'function') {
  // const result = instance.getCueState(/* arguments */);
}
// Public function: cueMeter
if (typeof instance.cueMeter === 'function') {
  // const result = instance.cueMeter(/* arguments */);
}
// Public function: createPreviewControl
if (typeof instance.createPreviewControl === 'function') {
  // const result = instance.createPreviewControl(/* arguments */);
}
// Public function: meter
if (typeof instance.meter === 'function') {
  // const result = instance.meter(/* arguments */);
}
// Public function: state
if (typeof instance.state === 'function') {
  // const result = instance.state(/* arguments */);
}
// Public function: getState
if (typeof instance.getState === 'function') {
  // const result = instance.getState(/* arguments */);
}
// Public function: destroy
if (typeof instance.destroy === 'function') {
  // const result = instance.destroy(/* arguments */);
}
```

Implementation guide: [BareMetal.DJMixer.md](BareMetal.DJMixer.md)

## BareMetal.Docchain

```html
<script src="src/BareMetal.DocChain.js"></script>
```

```js
const moduleApi = BareMetal.Docchain;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: type
if (typeof instance.type === 'function') {
  // const result = instance.type(/* arguments */);
}
// Public function: id
if (typeof instance.id === 'function') {
  // const result = instance.id(/* arguments */);
}
// Public function: data
if (typeof instance.data === 'function') {
  // const result = instance.data(/* arguments */);
}
// Public function: status
if (typeof instance.status === 'function') {
  // const result = instance.status(/* arguments */);
}
// Public function: parentId
if (typeof instance.parentId === 'function') {
  // const result = instance.parentId(/* arguments */);
}
// Public function: children
if (typeof instance.children === 'function') {
  // const result = instance.children(/* arguments */);
}
// Public function: created
if (typeof instance.created === 'function') {
  // const result = instance.created(/* arguments */);
}
// Public function: updated
if (typeof instance.updated === 'function') {
  // const result = instance.updated(/* arguments */);
}
// Public function: version
if (typeof instance.version === 'function') {
  // const result = instance.version(/* arguments */);
}
// Public function: meta
if (typeof instance.meta === 'function') {
  // const result = instance.meta(/* arguments */);
}
// Public function: auditTrail
if (typeof instance.auditTrail === 'function') {
  // const result = instance.auditTrail(/* arguments */);
}
```


## BareMetal.Document

```html
<script src="src/BareMetal.Document.js"></script>
```

```js
const moduleApi = BareMetal.Document;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: el
if (typeof instance.el === 'function') {
  // const result = instance.el(/* arguments */);
}
// Public function: page
if (typeof instance.page === 'function') {
  // const result = instance.page(/* arguments */);
}
// Public function: getHTML
if (typeof instance.getHTML === 'function') {
  // const result = instance.getHTML(/* arguments */);
}
// Public function: setHTML
if (typeof instance.setHTML === 'function') {
  // const result = instance.setHTML(/* arguments */);
}
// Public function: command
if (typeof instance.command === 'function') {
  // const result = instance.command(/* arguments */);
}
// Public function: bold
if (typeof instance.bold === 'function') {
  // const result = instance.bold(/* arguments */);
}
// Public function: italic
if (typeof instance.italic === 'function') {
  // const result = instance.italic(/* arguments */);
}
// Public function: underline
if (typeof instance.underline === 'function') {
  // const result = instance.underline(/* arguments */);
}
// Public function: heading
if (typeof instance.heading === 'function') {
  // const result = instance.heading(/* arguments */);
}
// Public function: paragraph
if (typeof instance.paragraph === 'function') {
  // const result = instance.paragraph(/* arguments */);
}
// Public function: list
if (typeof instance.list === 'function') {
  // const result = instance.list(/* arguments */);
}
// Public function: color
if (typeof instance.color === 'function') {
  // const result = instance.color(/* arguments */);
}
// Public function: hilite
if (typeof instance.hilite === 'function') {
  // const result = instance.hilite(/* arguments */);
}
// Public function: font
if (typeof instance.font === 'function') {
  // const result = instance.font(/* arguments */);
}
// Public function: fontSize
if (typeof instance.fontSize === 'function') {
  // const result = instance.fontSize(/* arguments */);
}
// Public function: query
if (typeof instance.query === 'function') {
  // const result = instance.query(/* arguments */);
}
```

Implementation guide: [BareMetal.Document.md](BareMetal.Document.md)

## BareMetal.Documentwal

```html
<script src="src/BareMetal.DocumentWAL.js"></script>
```

```js
const moduleApi = BareMetal.Documentwal;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: create
if (typeof instance.create === 'function') {
  // const result = instance.create(/* arguments */);
}
// Public function: memoryTransport
if (typeof instance.memoryTransport === 'function') {
  // const result = instance.memoryTransport(/* arguments */);
}
// Public function: httpTransport
if (typeof instance.httpTransport === 'function') {
  // const result = instance.httpTransport(/* arguments */);
}
// Public function: getPath
if (typeof instance.getPath === 'function') {
  // const result = instance.getPath(/* arguments */);
}
// Public function: setPath
if (typeof instance.setPath === 'function') {
  // const result = instance.setPath(/* arguments */);
}
```

Implementation guide: [BareMetal.Documentwal.md](BareMetal.Documentwal.md)

## BareMetal.DragDrop

```html
<script src="src/BareMetal.DragDrop.js"></script>
```

```js
const moduleApi = BareMetal.DragDrop;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: draggable
if (typeof instance.draggable === 'function') {
  // const result = instance.draggable(/* arguments */);
}
// Public function: droppable
if (typeof instance.droppable === 'function') {
  // const result = instance.droppable(/* arguments */);
}
// Public function: sortable
if (typeof instance.sortable === 'function') {
  // const result = instance.sortable(/* arguments */);
}
```

Implementation guide: [BareMetal.DragDrop.md](BareMetal.DragDrop.md)

## BareMetal.Errors

```html
<script src="src/BareMetal.Errors.js"></script>
```

```js
const moduleApi = BareMetal.Errors;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: BareMetalError
if (typeof instance.BareMetalError === 'function') {
  // const result = instance.BareMetalError(/* arguments */);
}
// Public function: create
if (typeof instance.create === 'function') {
  // const result = instance.create(/* arguments */);
}
// Public function: classify
if (typeof instance.classify === 'function') {
  // const result = instance.classify(/* arguments */);
}
// Public function: isRetryable
if (typeof instance.isRetryable === 'function') {
  // const result = instance.isRetryable(/* arguments */);
}
// Public function: isTransient
if (typeof instance.isTransient === 'function') {
  // const result = instance.isTransient(/* arguments */);
}
// Public function: chain
if (typeof instance.chain === 'function') {
  // const result = instance.chain(/* arguments */);
}
// Public function: getChain
if (typeof instance.getChain === 'function') {
  // const result = instance.getChain(/* arguments */);
}
// Public function: toUserSafe
if (typeof instance.toUserSafe === 'function') {
  // const result = instance.toUserSafe(/* arguments */);
}
// Public function: toJSON
if (typeof instance.toJSON === 'function') {
  // const result = instance.toJSON(/* arguments */);
}
// Public function: fromJSON
if (typeof instance.fromJSON === 'function') {
  // const result = instance.fromJSON(/* arguments */);
}
// Public function: wrap
if (typeof instance.wrap === 'function') {
  // const result = instance.wrap(/* arguments */);
}
// Public function: assert
if (typeof instance.assert === 'function') {
  // const result = instance.assert(/* arguments */);
}
// Public function: codes
if (typeof instance.codes === 'function') {
  // const result = instance.codes(/* arguments */);
}
// Public function: register
if (typeof instance.register === 'function') {
  // const result = instance.register(/* arguments */);
}
// Public function: lookup
if (typeof instance.lookup === 'function') {
  // const result = instance.lookup(/* arguments */);
}
// Public function: match
if (typeof instance.match === 'function') {
  // const result = instance.match(/* arguments */);
}
// Public function: aggregate
if (typeof instance.aggregate === 'function') {
  // const result = instance.aggregate(/* arguments */);
}
// Public function: boundary
if (typeof instance.boundary === 'function') {
  // const result = instance.boundary(/* arguments */);
}
```

Implementation guide: [BareMetal.Errors.md](BareMetal.Errors.md)

## BareMetal.Expressions

```html
<script src="src/BareMetal.Expressions.js"></script>
```

```js
const moduleApi = BareMetal.Expressions;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: hex
if (typeof instance.hex === 'function') {
  // const result = instance.hex(/* arguments */);
}
// Public function: description
if (typeof instance.description === 'function') {
  // const result = instance.description(/* arguments */);
}
// Public function: pattern
if (typeof instance.pattern === 'function') {
  // const result = instance.pattern(/* arguments */);
}
// Public function: examples
if (typeof instance.examples === 'function') {
  // const result = instance.examples(/* arguments */);
}
// Public function: extract
if (typeof instance.extract === 'function') {
  // const result = instance.extract(/* arguments */);
}
// Public function: detect
if (typeof instance.detect === 'function') {
  // const result = instance.detect(/* arguments */);
}
// Public function: validate
if (typeof instance.validate === 'function') {
  // const result = instance.validate(/* arguments */);
}
// Public function: prepare
if (typeof instance.prepare === 'function') {
  // const result = instance.prepare(/* arguments */);
}
// Public function: list
if (typeof instance.list === 'function') {
  // const result = instance.list(/* arguments */);
}
// Public function: info
if (typeof instance.info === 'function') {
  // const result = instance.info(/* arguments */);
}
// Public function: register
if (typeof instance.register === 'function') {
  // const result = instance.register(/* arguments */);
}
```

Implementation guide: [BareMetal.Expressions.md](BareMetal.Expressions.md)

## BareMetal.FileIo

```html
<script src="src/BareMetal.FileIO.js"></script>
```

```js
const moduleApi = BareMetal.FileIo;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: destroy
if (typeof instance.destroy === 'function') {
  // const result = instance.destroy(/* arguments */);
}
// Public function: open
if (typeof instance.open === 'function') {
  // const result = instance.open(/* arguments */);
}
// Public function: save
if (typeof instance.save === 'function') {
  // const result = instance.save(/* arguments */);
}
// Public function: dropZone
if (typeof instance.dropZone === 'function') {
  // const result = instance.dropZone(/* arguments */);
}
// Public function: readAsText
if (typeof instance.readAsText === 'function') {
  // const result = instance.readAsText(/* arguments */);
}
// Public function: pick
if (typeof instance.pick === 'function') {
  // const result = instance.pick(/* arguments */);
}
// Public function: formatSize
if (typeof instance.formatSize === 'function') {
  // const result = instance.formatSize(/* arguments */);
}
// Public function: slice
if (typeof instance.slice === 'function') {
  // const result = instance.slice(/* arguments */);
}
// Public function: blobToArrayBuffer
if (typeof instance.blobToArrayBuffer === 'function') {
  // const result = instance.blobToArrayBuffer(/* arguments */);
}
// Public function: hasFileSystemAccess
if (typeof instance.hasFileSystemAccess === 'function') {
  // const result = instance.hasFileSystemAccess(/* arguments */);
}
```

Implementation guide: [BareMetal.FileIo.md](BareMetal.FileIo.md)

## BareMetal.Font

```html
<script src="src/BareMetal.Font.js"></script>
```

```js
const moduleApi = BareMetal.Font;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: el
if (typeof instance.el === 'function') {
  // const result = instance.el(/* arguments */);
}
// Public function: get
if (typeof instance.get === 'function') {
  // const result = instance.get(/* arguments */);
}
// Public function: set
if (typeof instance.set === 'function') {
  // const result = instance.set(/* arguments */);
}
```

Implementation guide: [BareMetal.Font.md](BareMetal.Font.md)

## BareMetal.Footerbar

```html
<script src="src/BareMetal.FooterBar.js"></script>
```

```js
const moduleApi = BareMetal.Footerbar;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: el
if (typeof instance.el === 'function') {
  // const result = instance.el(/* arguments */);
}
// Public function: setStatus
if (typeof instance.setStatus === 'function') {
  // const result = instance.setStatus(/* arguments */);
}
// Public function: setTabs
if (typeof instance.setTabs === 'function') {
  // const result = instance.setTabs(/* arguments */);
}
// Public function: setZoom
if (typeof instance.setZoom === 'function') {
  // const result = instance.setZoom(/* arguments */);
}
// Public function: getZoom
if (typeof instance.getZoom === 'function') {
  // const result = instance.getZoom(/* arguments */);
}
```

Implementation guide: [BareMetal.Footerbar.md](BareMetal.Footerbar.md)

## BareMetal.Forms

```html
<script src="src/BareMetal.Forms.js"></script>
```

```js
const moduleApi = BareMetal.Forms;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: destroy
if (typeof instance.destroy === 'function') {
  // const result = instance.destroy(/* arguments */);
}
// Public function: create
if (typeof instance.create === 'function') {
  // const result = instance.create(/* arguments */);
}
// Public function: getState
if (typeof instance.getState === 'function') {
  // const result = instance.getState(/* arguments */);
}
// Public function: serialize
if (typeof instance.serialize === 'function') {
  // const result = instance.serialize(/* arguments */);
}
// Public function: deserialize
if (typeof instance.deserialize === 'function') {
  // const result = instance.deserialize(/* arguments */);
}
// Public function: validate
if (typeof instance.validate === 'function') {
  // const result = instance.validate(/* arguments */);
}
// Public function: mask
if (typeof instance.mask === 'function') {
  // const result = instance.mask(/* arguments */);
}
// Public function: wizard
if (typeof instance.wizard === 'function') {
  // const result = instance.wizard(/* arguments */);
}
// Public function: repeater
if (typeof instance.repeater === 'function') {
  // const result = instance.repeater(/* arguments */);
}
// Public function: autosave
if (typeof instance.autosave === 'function') {
  // const result = instance.autosave(/* arguments */);
}
// Public function: conditional
if (typeof instance.conditional === 'function') {
  // const result = instance.conditional(/* arguments */);
}
// Public function: submit
if (typeof instance.submit === 'function') {
  // const result = instance.submit(/* arguments */);
}
// Public function: fromJSON
if (typeof instance.fromJSON === 'function') {
  // const result = instance.fromJSON(/* arguments */);
}
// Public function: toFormData
if (typeof instance.toFormData === 'function') {
  // const result = instance.toFormData(/* arguments */);
}
// Public function: diff
if (typeof instance.diff === 'function') {
  // const result = instance.diff(/* arguments */);
}
// Public function: focus
if (typeof instance.focus === 'function') {
  // const result = instance.focus(/* arguments */);
}
```

Implementation guide: [BareMetal.Forms.md](BareMetal.Forms.md)

## BareMetal.Gallery

```html
<script src="src/BareMetal.Gallery.js"></script>
```

```js
const moduleApi = BareMetal.Gallery;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Gallery.md](BareMetal.Gallery.md)

## BareMetal.Gamepad

```html
<script src="src/BareMetal.Gamepad.js"></script>
```

```js
const moduleApi = BareMetal.Gamepad;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Gamepad.md](BareMetal.Gamepad.md)

## BareMetal.Geo

```html
<script src="src/BareMetal.Geo.js"></script>
```

```js
const moduleApi = BareMetal.Geo;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Geo.md](BareMetal.Geo.md)

## BareMetal.Graph

```html
<script src="src/BareMetal.Graph.js"></script>
```

```js
const moduleApi = BareMetal.Graph;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: xmlns
if (typeof instance.xmlns === 'function') {
  // const result = instance.xmlns(/* arguments */);
}
// Public function: style
if (typeof instance.style === 'function') {
  // const result = instance.style(/* arguments */);
}
// Public function: y
if (typeof instance.y === 'function') {
  // const result = instance.y(/* arguments */);
}
// Public function: svg
if (typeof instance.svg === 'function') {
  // const result = instance.svg(/* arguments */);
}
// Public function: simulation
if (typeof instance.simulation === 'function') {
  // const result = instance.simulation(/* arguments */);
}
// Public function: nodes
if (typeof instance.nodes === 'function') {
  // const result = instance.nodes(/* arguments */);
}
// Public function: edges
if (typeof instance.edges === 'function') {
  // const result = instance.edges(/* arguments */);
}
```

Implementation guide: [BareMetal.Graph.md](BareMetal.Graph.md)

## BareMetal.I18n

```html
<script src="src/BareMetal.I18n.js"></script>
```

```js
const moduleApi = BareMetal.I18n;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: setLocale
if (typeof instance.setLocale === 'function') {
  // const result = instance.setLocale(/* arguments */);
}
// Public function: getLocale
if (typeof instance.getLocale === 'function') {
  // const result = instance.getLocale(/* arguments */);
}
// Public function: addMessages
if (typeof instance.addMessages === 'function') {
  // const result = instance.addMessages(/* arguments */);
}
// Public function: t
if (typeof instance.t === 'function') {
  // const result = instance.t(/* arguments */);
}
// Public function: loadMessages
if (typeof instance.loadMessages === 'function') {
  // const result = instance.loadMessages(/* arguments */);
}
// Public function: isRTL
if (typeof instance.isRTL === 'function') {
  // const result = instance.isRTL(/* arguments */);
}
// Public function: subscribe
if (typeof instance.subscribe === 'function') {
  // const result = instance.subscribe(/* arguments */);
}
// Public function: configure
if (typeof instance.configure === 'function') {
  // const result = instance.configure(/* arguments */);
}
```

Implementation guide: [BareMetal.I18n.md](BareMetal.I18n.md)

## BareMetal.ID3

```html
<script src="src/BareMetal.ID3.js"></script>
```

```js
const moduleApi = BareMetal.ID3;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: title
if (typeof instance.title === 'function') {
  // const result = instance.title(/* arguments */);
}
// Public function: artist
if (typeof instance.artist === 'function') {
  // const result = instance.artist(/* arguments */);
}
// Public function: album
if (typeof instance.album === 'function') {
  // const result = instance.album(/* arguments */);
}
// Public function: year
if (typeof instance.year === 'function') {
  // const result = instance.year(/* arguments */);
}
// Public function: comment
if (typeof instance.comment === 'function') {
  // const result = instance.comment(/* arguments */);
}
// Public function: track
if (typeof instance.track === 'function') {
  // const result = instance.track(/* arguments */);
}
// Public function: genre
if (typeof instance.genre === 'function') {
  // const result = instance.genre(/* arguments */);
}
```

Implementation guide: [BareMetal.ID3.md](BareMetal.ID3.md)

## BareMetal.IDB

```html
<script src="src/BareMetal.IDB.js"></script>
```

```js
const moduleApi = BareMetal.IDB;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: set
if (typeof instance.set === 'function') {
  // const result = instance.set(/* arguments */);
}
// Public function: get
if (typeof instance.get === 'function') {
  // const result = instance.get(/* arguments */);
}
// Public function: delete
if (typeof instance.delete === 'function') {
  // const result = instance.delete(/* arguments */);
}
// Public function: has
if (typeof instance.has === 'function') {
  // const result = instance.has(/* arguments */);
}
// Public function: keys
if (typeof instance.keys === 'function') {
  // const result = instance.keys(/* arguments */);
}
// Public function: clear
if (typeof instance.clear === 'function') {
  // const result = instance.clear(/* arguments */);
}
// Public function: close
if (typeof instance.close === 'function') {
  // const result = instance.close(/* arguments */);
}
```

Implementation guide: [BareMetal.IDB.md](BareMetal.IDB.md)

## BareMetal.Inbox

```html
<script src="src/BareMetal.Inbox.js"></script>
```

```js
const moduleApi = BareMetal.Inbox;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: id
if (typeof instance.id === 'function') {
  // const result = instance.id(/* arguments */);
}
// Public function: channel
if (typeof instance.channel === 'function') {
  // const result = instance.channel(/* arguments */);
}
// Public function: title
if (typeof instance.title === 'function') {
  // const result = instance.title(/* arguments */);
}
// Public function: body
if (typeof instance.body === 'function') {
  // const result = instance.body(/* arguments */);
}
// Public function: data
if (typeof instance.data === 'function') {
  // const result = instance.data(/* arguments */);
}
// Public function: priority
if (typeof instance.priority === 'function') {
  // const result = instance.priority(/* arguments */);
}
// Public function: action
if (typeof instance.action === 'function') {
  // const result = instance.action(/* arguments */);
}
// Public function: icon
if (typeof instance.icon === 'function') {
  // const result = instance.icon(/* arguments */);
}
// Public function: group
if (typeof instance.group === 'function') {
  // const result = instance.group(/* arguments */);
}
// Public function: read
if (typeof instance.read === 'function') {
  // const result = instance.read(/* arguments */);
}
// Public function: timestamp
if (typeof instance.timestamp === 'function') {
  // const result = instance.timestamp(/* arguments */);
}
// Public function: dismissed
if (typeof instance.dismissed === 'function') {
  // const result = instance.dismissed(/* arguments */);
}
// Public function: pinned
if (typeof instance.pinned === 'function') {
  // const result = instance.pinned(/* arguments */);
}
// Public function: summary
if (typeof instance.summary === 'function') {
  // const result = instance.summary(/* arguments */);
}
// Public function: items
if (typeof instance.items === 'function') {
  // const result = instance.items(/* arguments */);
}
```


## BareMetal.InputRouter

```html
<script src="src/BareMetal.InputRouter.js"></script>
```

```js
const moduleApi = BareMetal.InputRouter;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```


## BareMetal.Integrity

```html
<script src="src/BareMetal.Integrity.js"></script>
```

```js
const moduleApi = BareMetal.Integrity;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: sha256
if (typeof instance.sha256 === 'function') {
  // const result = instance.sha256(/* arguments */);
}
// Public function: verify
if (typeof instance.verify === 'function') {
  // const result = instance.verify(/* arguments */);
}
// Public function: createManifest
if (typeof instance.createManifest === 'function') {
  // const result = instance.createManifest(/* arguments */);
}
// Public function: verifyManifest
if (typeof instance.verifyManifest === 'function') {
  // const result = instance.verifyManifest(/* arguments */);
}
```

Implementation guide: [BareMetal.Integrity.md](BareMetal.Integrity.md)

## BareMetal.Launcher

```html
<script src="src/BareMetal.Launcher.js"></script>
```

```js
const moduleApi = BareMetal.Launcher;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: createStore
if (typeof instance.createStore === 'function') {
  // const result = instance.createStore(/* arguments */);
}
// Public function: createApi
if (typeof instance.createApi === 'function') {
  // const result = instance.createApi(/* arguments */);
}
// Public function: createSocket
if (typeof instance.createSocket === 'function') {
  // const result = instance.createSocket(/* arguments */);
}
// Public function: attachTerminal
if (typeof instance.attachTerminal === 'function') {
  // const result = instance.attachTerminal(/* arguments */);
}
// Public function: renderSessionCards
if (typeof instance.renderSessionCards === 'function') {
  // const result = instance.renderSessionCards(/* arguments */);
}
// Public function: createLauncher
if (typeof instance.createLauncher === 'function') {
  // const result = instance.createLauncher(/* arguments */);
}
```

Implementation guide: [BareMetal.Launcher.md](BareMetal.Launcher.md)

## BareMetal.LocalKvStore

```html
<script src="src/BareMetal.LocalKVStore.js"></script>
```

```js
const moduleApi = BareMetal.LocalKvStore;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: get
if (typeof instance.get === 'function') {
  // const result = instance.get(/* arguments */);
}
// Public function: set
if (typeof instance.set === 'function') {
  // const result = instance.set(/* arguments */);
}
// Public function: remove
if (typeof instance.remove === 'function') {
  // const result = instance.remove(/* arguments */);
}
// Public function: has
if (typeof instance.has === 'function') {
  // const result = instance.has(/* arguments */);
}
// Public function: clear
if (typeof instance.clear === 'function') {
  // const result = instance.clear(/* arguments */);
}
// Public function: allEntries
if (typeof instance.allEntries === 'function') {
  // const result = instance.allEntries(/* arguments */);
}
// Public function: getRaw
if (typeof instance.getRaw === 'function') {
  // const result = instance.getRaw(/* arguments */);
}
// Public function: setRaw
if (typeof instance.setRaw === 'function') {
  // const result = instance.setRaw(/* arguments */);
}
```

Implementation guide: [BareMetal.LocalKvStore.md](BareMetal.LocalKvStore.md)

## BareMetal.Logger

```html
<script src="src/BareMetal.Logger.js"></script>
```

```js
const moduleApi = BareMetal.Logger;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: create
if (typeof instance.create === 'function') {
  // const result = instance.create(/* arguments */);
}
// Public function: console
if (typeof instance.console === 'function') {
  // const result = instance.console(/* arguments */);
}
// Public function: beacon
if (typeof instance.beacon === 'function') {
  // const result = instance.beacon(/* arguments */);
}
```

Implementation guide: [BareMetal.Logger.md](BareMetal.Logger.md)

## BareMetal.Markdown

```html
<script src="src/BareMetal.Markdown.js"></script>
```

```js
const moduleApi = BareMetal.Markdown;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: meta
if (typeof instance.meta === 'function') {
  // const result = instance.meta(/* arguments */);
}
// Public function: render
if (typeof instance.render === 'function') {
  // const result = instance.render(/* arguments */);
}
// Public function: renderTo
if (typeof instance.renderTo === 'function') {
  // const result = instance.renderTo(/* arguments */);
}
// Public function: renderSafe
if (typeof instance.renderSafe === 'function') {
  // const result = instance.renderSafe(/* arguments */);
}
// Public function: createRenderer
if (typeof instance.createRenderer === 'function') {
  // const result = instance.createRenderer(/* arguments */);
}
// Public function: toc
if (typeof instance.toc === 'function') {
  // const result = instance.toc(/* arguments */);
}
// Public function: frontMatter
if (typeof instance.frontMatter === 'function') {
  // const result = instance.frontMatter(/* arguments */);
}
// Public function: inline
if (typeof instance.inline === 'function') {
  // const result = instance.inline(/* arguments */);
}
// Public function: escape
if (typeof instance.escape === 'function') {
  // const result = instance.escape(/* arguments */);
}
```

Implementation guide: [BareMetal.Markdown.md](BareMetal.Markdown.md)

## BareMetal.Media

```html
<script src="src/BareMetal.Media.js"></script>
```

```js
const moduleApi = BareMetal.Media;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Media.md](BareMetal.Media.md)

## BareMetal.MermaidDiagramRenderer

```html
<script src="src/BareMetal.MermaidDiagramRenderer.js"></script>
```

```js
const moduleApi = BareMetal.MermaidDiagramRenderer;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.MermaidDiagramRenderer.md](BareMetal.MermaidDiagramRenderer.md)

## BareMetal.Metadata

```html
<script src="src/BareMetal.Metadata.js"></script>
```

```js
const moduleApi = BareMetal.Metadata;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: register
if (typeof instance.register === 'function') {
  // const result = instance.register(/* arguments */);
}
// Public function: get
if (typeof instance.get === 'function') {
  // const result = instance.get(/* arguments */);
}
// Public function: list
if (typeof instance.list === 'function') {
  // const result = instance.list(/* arguments */);
}
// Public function: remove
if (typeof instance.remove === 'function') {
  // const result = instance.remove(/* arguments */);
}
// Public function: scanInline
if (typeof instance.scanInline === 'function') {
  // const result = instance.scanInline(/* arguments */);
}
// Public function: fetchAndRegister
if (typeof instance.fetchAndRegister === 'function') {
  // const result = instance.fetchAndRegister(/* arguments */);
}
// Public function: renderForm
if (typeof instance.renderForm === 'function') {
  // const result = instance.renderForm(/* arguments */);
}
// Public function: renderTable
if (typeof instance.renderTable === 'function') {
  // const result = instance.renderTable(/* arguments */);
}
// Public function: toTemplateFields
if (typeof instance.toTemplateFields === 'function') {
  // const result = instance.toTemplateFields(/* arguments */);
}
// Public function: fromBinary
if (typeof instance.fromBinary === 'function') {
  // const result = instance.fromBinary(/* arguments */);
}
```

Implementation guide: [BareMetal.Metadata.md](BareMetal.Metadata.md)

## BareMetal.MIDI

```html
<script src="src/BareMetal.MIDI.js"></script>
```

```js
const moduleApi = BareMetal.MIDI;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: request
if (typeof instance.request === 'function') {
  // const result = instance.request(/* arguments */);
}
// Public function: onMessage
if (typeof instance.onMessage === 'function') {
  // const result = instance.onMessage(/* arguments */);
}
// Public function: mapCC
if (typeof instance.mapCC === 'function') {
  // const result = instance.mapCC(/* arguments */);
}
// Public function: mapPitchBend
if (typeof instance.mapPitchBend === 'function') {
  // const result = instance.mapPitchBend(/* arguments */);
}
// Public function: getInputs
if (typeof instance.getInputs === 'function') {
  // const result = instance.getInputs(/* arguments */);
}
// Public function: getOutputs
if (typeof instance.getOutputs === 'function') {
  // const result = instance.getOutputs(/* arguments */);
}
// Public function: getDevices
if (typeof instance.getDevices === 'function') {
  // const result = instance.getDevices(/* arguments */);
}
// Public function: send
if (typeof instance.send === 'function') {
  // const result = instance.send(/* arguments */);
}
// Public function: destroy
if (typeof instance.destroy === 'function') {
  // const result = instance.destroy(/* arguments */);
}
```

Implementation guide: [BareMetal.MIDI.md](BareMetal.MIDI.md)

## BareMetal.MIDIProfiles

```html
<script src="src/BareMetal.MIDIProfiles.js"></script>
```

```js
const moduleApi = BareMetal.MIDIProfiles;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: importJson
if (typeof instance.importJson === 'function') {
  // const result = instance.importJson(/* arguments */);
}
// Public function: exportJson
if (typeof instance.exportJson === 'function') {
  // const result = instance.exportJson(/* arguments */);
}
// Public function: activate
if (typeof instance.activate === 'function') {
  // const result = instance.activate(/* arguments */);
}
// Public function: learn
if (typeof instance.learn === 'function') {
  // const result = instance.learn(/* arguments */);
}
// Public function: cancelLearn
if (typeof instance.cancelLearn === 'function') {
  // const result = instance.cancelLearn(/* arguments */);
}
// Public function: capture
if (typeof instance.capture === 'function') {
  // const result = instance.capture(/* arguments */);
}
// Public function: resolveMessage
if (typeof instance.resolveMessage === 'function') {
  // const result = instance.resolveMessage(/* arguments */);
}
// Public function: listProfiles
if (typeof instance.listProfiles === 'function') {
  // const result = instance.listProfiles(/* arguments */);
}
// Public function: omnisDuoPlaceholder
if (typeof instance.omnisDuoPlaceholder === 'function') {
  // const result = instance.omnisDuoPlaceholder(/* arguments */);
}
```

Implementation guide: [BareMetal.MIDIProfiles.md](BareMetal.MIDIProfiles.md)

## BareMetal.Minifier

```html
<script src="src/BareMetal.Minifier.js"></script>
```

```js
const moduleApi = BareMetal.Minifier;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: end
if (typeof instance.end === 'function') {
  // const result = instance.end(/* arguments */);
}
// Public function: minifyJS
if (typeof instance.minifyJS === 'function') {
  // const result = instance.minifyJS(/* arguments */);
}
// Public function: minifyCSS
if (typeof instance.minifyCSS === 'function') {
  // const result = instance.minifyCSS(/* arguments */);
}
// Public function: compressGzip
if (typeof instance.compressGzip === 'function') {
  // const result = instance.compressGzip(/* arguments */);
}
// Public function: decompressGzip
if (typeof instance.decompressGzip === 'function') {
  // const result = instance.decompressGzip(/* arguments */);
}
```


## BareMetal.Modal

```html
<script src="src/BareMetal.Modal.js"></script>
```

```js
const moduleApi = BareMetal.Modal;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Modal.md](BareMetal.Modal.md)

## BareMetal.ModuleLoader

```html
<script src="src/BareMetal.ModuleLoader.js"></script>
```

```js
const moduleApi = BareMetal.ModuleLoader;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.ModuleLoader.md](BareMetal.ModuleLoader.md)

## BareMetal.MP3

```html
<script src="src/BareMetal.MP3.js"></script>
```

```js
const moduleApi = BareMetal.MP3;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: readTags
if (typeof instance.readTags === 'function') {
  // const result = instance.readTags(/* arguments */);
}
// Public function: create
if (typeof instance.create === 'function') {
  // const result = instance.create(/* arguments */);
}
// Public function: stream
if (typeof instance.stream === 'function') {
  // const result = instance.stream(/* arguments */);
}
// Public function: loadCatalog
if (typeof instance.loadCatalog === 'function') {
  // const result = instance.loadCatalog(/* arguments */);
}
```

Implementation guide: [BareMetal.MP3.md](BareMetal.MP3.md)

## BareMetal.MP3Catalog

```html
<script src="src/BareMetal.MP3Catalog.js"></script>
```

```js
const moduleApi = BareMetal.MP3Catalog;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: add
if (typeof instance.add === 'function') {
  // const result = instance.add(/* arguments */);
}
// Public function: addMany
if (typeof instance.addMany === 'function') {
  // const result = instance.addMany(/* arguments */);
}
// Public function: update
if (typeof instance.update === 'function') {
  // const result = instance.update(/* arguments */);
}
// Public function: remove
if (typeof instance.remove === 'function') {
  // const result = instance.remove(/* arguments */);
}
// Public function: get
if (typeof instance.get === 'function') {
  // const result = instance.get(/* arguments */);
}
// Public function: list
if (typeof instance.list === 'function') {
  // const result = instance.list(/* arguments */);
}
// Public function: search
if (typeof instance.search === 'function') {
  // const result = instance.search(/* arguments */);
}
// Public function: clear
if (typeof instance.clear === 'function') {
  // const result = instance.clear(/* arguments */);
}
// Public function: manifest
if (typeof instance.manifest === 'function') {
  // const result = instance.manifest(/* arguments */);
}
// Public function: onChange
if (typeof instance.onChange === 'function') {
  // const result = instance.onChange(/* arguments */);
}
```

Implementation guide: [BareMetal.MP3Catalog.md](BareMetal.MP3Catalog.md)

## BareMetal.MusicPlayer

```html
<script src="src/BareMetal.MusicPlayer.js"></script>
```

```js
const moduleApi = BareMetal.MusicPlayer;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: index
if (typeof instance.index === 'function') {
  // const result = instance.index(/* arguments */);
}
// Public function: currentTime
if (typeof instance.currentTime === 'function') {
  // const result = instance.currentTime(/* arguments */);
}
// Public function: volume
if (typeof instance.volume === 'function') {
  // const result = instance.volume(/* arguments */);
}
// Public function: pitchBendSemitones
if (typeof instance.pitchBendSemitones === 'function') {
  // const result = instance.pitchBendSemitones(/* arguments */);
}
// Public function: highDb
if (typeof instance.highDb === 'function') {
  // const result = instance.highDb(/* arguments */);
}
// Public function: streaming
if (typeof instance.streaming === 'function') {
  // const result = instance.streaming(/* arguments */);
}
```

Implementation guide: [BareMetal.MusicPlayer.md](BareMetal.MusicPlayer.md)

## BareMetal.Notify

```html
<script src="src/BareMetal.Notify.js"></script>
```

```js
const moduleApi = BareMetal.Notify;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Notify.md](BareMetal.Notify.md)

## BareMetal.Observe

```html
<script src="src/BareMetal.Observe.js"></script>
```

```js
const moduleApi = BareMetal.Observe;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Observe.md](BareMetal.Observe.md)

## BareMetal.Pay

```html
<script src="src/BareMetal.Pay.js"></script>
```

```js
const moduleApi = BareMetal.Pay;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: valid
if (typeof instance.valid === 'function') {
  // const result = instance.valid(/* arguments */);
}
// Public function: canPay
if (typeof instance.canPay === 'function') {
  // const result = instance.canPay(/* arguments */);
}
// Public function: request
if (typeof instance.request === 'function') {
  // const result = instance.request(/* arguments */);
}
// Public function: card
if (typeof instance.card === 'function') {
  // const result = instance.card(/* arguments */);
}
// Public function: googlePay
if (typeof instance.googlePay === 'function') {
  // const result = instance.googlePay(/* arguments */);
}
// Public function: applePay
if (typeof instance.applePay === 'function') {
  // const result = instance.applePay(/* arguments */);
}
// Public function: formatCurrency
if (typeof instance.formatCurrency === 'function') {
  // const result = instance.formatCurrency(/* arguments */);
}
// Public function: cart
if (typeof instance.cart === 'function') {
  // const result = instance.cart(/* arguments */);
}
// Public function: shipping
if (typeof instance.shipping === 'function') {
  // const result = instance.shipping(/* arguments */);
}
// Public function: validate
if (typeof instance.validate === 'function') {
  // const result = instance.validate(/* arguments */);
}
// Public function: abort
if (typeof instance.abort === 'function') {
  // const result = instance.abort(/* arguments */);
}
// Public function: complete
if (typeof instance.complete === 'function') {
  // const result = instance.complete(/* arguments */);
}
// Public function: retry
if (typeof instance.retry === 'function') {
  // const result = instance.retry(/* arguments */);
}
```

Implementation guide: [BareMetal.Pay.md](BareMetal.Pay.md)

## BareMetal.PicoScript

```html
<script src="src/BareMetal.PicoScript.js"></script>
```

```js
const moduleApi = BareMetal.PicoScript;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: compile
if (typeof instance.compile === 'function') {
  // const result = instance.compile(/* arguments */);
}
// Public function: compilePython
if (typeof instance.compilePython === 'function') {
  // const result = instance.compilePython(/* arguments */);
}
// Public function: compileDebug
if (typeof instance.compileDebug === 'function') {
  // const result = instance.compileDebug(/* arguments */);
}
// Public function: symbolize
if (typeof instance.symbolize === 'function') {
  // const result = instance.symbolize(/* arguments */);
}
// Public function: VM
if (typeof instance.VM === 'function') {
  // const result = instance.VM(/* arguments */);
}
// Public function: PicoCompress
if (typeof instance.PicoCompress === 'function') {
  // const result = instance.PicoCompress(/* arguments */);
}
```

Implementation guide: [BareMetal.PicoScript.md](BareMetal.PicoScript.md)

## BareMetal.Pipeline

```html
<script src="src/BareMetal.Pipeline.js"></script>
```

```js
const moduleApi = BareMetal.Pipeline;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: create
if (typeof instance.create === 'function') {
  // const result = instance.create(/* arguments */);
}
// Public function: stream
if (typeof instance.stream === 'function') {
  // const result = instance.stream(/* arguments */);
}
// Public function: compose
if (typeof instance.compose === 'function') {
  // const result = instance.compose(/* arguments */);
}
// Public function: series
if (typeof instance.series === 'function') {
  // const result = instance.series(/* arguments */);
}
// Public function: parallel
if (typeof instance.parallel === 'function') {
  // const result = instance.parallel(/* arguments */);
}
// Public function: waterfall
if (typeof instance.waterfall === 'function') {
  // const result = instance.waterfall(/* arguments */);
}
// Public function: backpressure
if (typeof instance.backpressure === 'function') {
  // const result = instance.backpressure(/* arguments */);
}
```

Implementation guide: [BareMetal.Pipeline.md](BareMetal.Pipeline.md)

## BareMetal.Pivot

```html
<script src="src/BareMetal.Pivot.js"></script>
```

```js
const moduleApi = BareMetal.Pivot;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: lab
if (typeof instance.lab === 'function') {
  // const result = instance.lab(/* arguments */);
}
// Public function: el
if (typeof instance.el === 'function') {
  // const result = instance.el(/* arguments */);
}
// Public function: compute
if (typeof instance.compute === 'function') {
  // const result = instance.compute(/* arguments */);
}
// Public function: setRecords
if (typeof instance.setRecords === 'function') {
  // const result = instance.setRecords(/* arguments */);
}
// Public function: state
if (typeof instance.state === 'function') {
  // const result = instance.state(/* arguments */);
}
```

Implementation guide: [BareMetal.Pivot.md](BareMetal.Pivot.md)

## BareMetal.Play

```html
<script src="src/BareMetal.Play.js"></script>
```

```js
const moduleApi = BareMetal.Play;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: PACKS
if (typeof instance.PACKS === 'function') {
  // const result = instance.PACKS(/* arguments */);
}
// Public function: freshState
if (typeof instance.freshState === 'function') {
  // const result = instance.freshState(/* arguments */);
}
// Public function: matchConditions
if (typeof instance.matchConditions === 'function') {
  // const result = instance.matchConditions(/* arguments */);
}
// Public function: applyEffects
if (typeof instance.applyEffects === 'function') {
  // const result = instance.applyEffects(/* arguments */);
}
// Public function: entryNode
if (typeof instance.entryNode === 'function') {
  // const result = instance.entryNode(/* arguments */);
}
// Public function: offeredChoices
if (typeof instance.offeredChoices === 'function') {
  // const result = instance.offeredChoices(/* arguments */);
}
// Public function: fillText
if (typeof instance.fillText === 'function') {
  // const result = instance.fillText(/* arguments */);
}
// Public function: withPersonaFacts
if (typeof instance.withPersonaFacts === 'function') {
  // const result = instance.withPersonaFacts(/* arguments */);
}
// Public function: narratorOf
if (typeof instance.narratorOf === 'function') {
  // const result = instance.narratorOf(/* arguments */);
}
// Public function: sceneText
if (typeof instance.sceneText === 'function') {
  // const result = instance.sceneText(/* arguments */);
}
// Public function: slipsFor
if (typeof instance.slipsFor === 'function') {
  // const result = instance.slipsFor(/* arguments */);
}
// Public function: fireTriggers
if (typeof instance.fireTriggers === 'function') {
  // const result = instance.fireTriggers(/* arguments */);
}
// Public function: memoryClient
if (typeof instance.memoryClient === 'function') {
  // const result = instance.memoryClient(/* arguments */);
}
// Public function: mount
if (typeof instance.mount === 'function') {
  // const result = instance.mount(/* arguments */);
}
```

Implementation guide: [BareMetal.Play.md](BareMetal.Play.md)

## BareMetal.Print

```html
<script src="src/BareMetal.Print.js"></script>
```

```js
const moduleApi = BareMetal.Print;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: subtotal
if (typeof instance.subtotal === 'function') {
  // const result = instance.subtotal(/* arguments */);
}
// Public function: pageHeight
if (typeof instance.pageHeight === 'function') {
  // const result = instance.pageHeight(/* arguments */);
}
// Public function: pageWidth
if (typeof instance.pageWidth === 'function') {
  // const result = instance.pageWidth(/* arguments */);
}
// Public function: margins
if (typeof instance.margins === 'function') {
  // const result = instance.margins(/* arguments */);
}
// Public function: headerHeight
if (typeof instance.headerHeight === 'function') {
  // const result = instance.headerHeight(/* arguments */);
}
// Public function: footerHeight
if (typeof instance.footerHeight === 'function') {
  // const result = instance.footerHeight(/* arguments */);
}
// Public function: render
if (typeof instance.render === 'function') {
  // const result = instance.render(/* arguments */);
}
// Public function: paginate
if (typeof instance.paginate === 'function') {
  // const result = instance.paginate(/* arguments */);
}
// Public function: print
if (typeof instance.print === 'function') {
  // const result = instance.print(/* arguments */);
}
// Public function: preview
if (typeof instance.preview === 'function') {
  // const result = instance.preview(/* arguments */);
}
// Public function: stylesheet
if (typeof instance.stylesheet === 'function') {
  // const result = instance.stylesheet(/* arguments */);
}
// Public function: receipt
if (typeof instance.receipt === 'function') {
  // const result = instance.receipt(/* arguments */);
}
// Public function: invoice
if (typeof instance.invoice === 'function') {
  // const result = instance.invoice(/* arguments */);
}
// Public function: document
if (typeof instance.document === 'function') {
  // const result = instance.document(/* arguments */);
}
// Public function: fromDocChain
if (typeof instance.fromDocChain === 'function') {
  // const result = instance.fromDocChain(/* arguments */);
}
// Public function: grid
if (typeof instance.grid === 'function') {
  // const result = instance.grid(/* arguments */);
}
// Public function: table
if (typeof instance.table === 'function') {
  // const result = instance.table(/* arguments */);
}
// Public function: barcode
if (typeof instance.barcode === 'function') {
  // const result = instance.barcode(/* arguments */);
}
// Public function: qr
if (typeof instance.qr === 'function') {
  // const result = instance.qr(/* arguments */);
}
// Public function: label
if (typeof instance.label === 'function') {
  // const result = instance.label(/* arguments */);
}
// Public function: header
if (typeof instance.header === 'function') {
  // const result = instance.header(/* arguments */);
}
// Public function: footer
if (typeof instance.footer === 'function') {
  // const result = instance.footer(/* arguments */);
}
// Public function: section
if (typeof instance.section === 'function') {
  // const result = instance.section(/* arguments */);
}
// Public function: columns
if (typeof instance.columns === 'function') {
  // const result = instance.columns(/* arguments */);
}
// Public function: image
if (typeof instance.image === 'function') {
  // const result = instance.image(/* arguments */);
}
// Public function: spacer
if (typeof instance.spacer === 'function') {
  // const result = instance.spacer(/* arguments */);
}
// Public function: _internals
if (typeof instance._internals === 'function') {
  // const result = instance._internals(/* arguments */);
}
// Public function: tableHtml
if (typeof instance.tableHtml === 'function') {
  // const result = instance.tableHtml(/* arguments */);
}
// Public function: barcodeSvg
if (typeof instance.barcodeSvg === 'function') {
  // const result = instance.barcodeSvg(/* arguments */);
}
// Public function: qrSvg
if (typeof instance.qrSvg === 'function') {
  // const result = instance.qrSvg(/* arguments */);
}
// Public function: qrMatrix
if (typeof instance.qrMatrix === 'function') {
  // const result = instance.qrMatrix(/* arguments */);
}
// Public function: collectBlocks
if (typeof instance.collectBlocks === 'function') {
  // const result = instance.collectBlocks(/* arguments */);
}
// Public function: htmlToThermalText
if (typeof instance.htmlToThermalText === 'function') {
  // const result = instance.htmlToThermalText(/* arguments */);
}
```


## BareMetal.Progressive

```html
<script src="src/BareMetal.Progressive.js"></script>
```

```js
const moduleApi = BareMetal.Progressive;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: register
if (typeof instance.register === 'function') {
  // const result = instance.register(/* arguments */);
}
// Public function: unregister
if (typeof instance.unregister === 'function') {
  // const result = instance.unregister(/* arguments */);
}
// Public function: getRegistration
if (typeof instance.getRegistration === 'function') {
  // const result = instance.getRegistration(/* arguments */);
}
// Public function: update
if (typeof instance.update === 'function') {
  // const result = instance.update(/* arguments */);
}
// Public function: onInstallPrompt
if (typeof instance.onInstallPrompt === 'function') {
  // const result = instance.onInstallPrompt(/* arguments */);
}
// Public function: isInstalled
if (typeof instance.isInstalled === 'function') {
  // const result = instance.isInstalled(/* arguments */);
}
// Public function: isInstallable
if (typeof instance.isInstallable === 'function') {
  // const result = instance.isInstallable(/* arguments */);
}
// Public function: precache
if (typeof instance.precache === 'function') {
  // const result = instance.precache(/* arguments */);
}
// Public function: clearCache
if (typeof instance.clearCache === 'function') {
  // const result = instance.clearCache(/* arguments */);
}
// Public function: getCacheStatus
if (typeof instance.getCacheStatus === 'function') {
  // const result = instance.getCacheStatus(/* arguments */);
}
// Public function: isOnline
if (typeof instance.isOnline === 'function') {
  // const result = instance.isOnline(/* arguments */);
}
// Public function: onConnectivityChange
if (typeof instance.onConnectivityChange === 'function') {
  // const result = instance.onConnectivityChange(/* arguments */);
}
// Public function: requestSync
if (typeof instance.requestSync === 'function') {
  // const result = instance.requestSync(/* arguments */);
}
// Public function: subscribePush
if (typeof instance.subscribePush === 'function') {
  // const result = instance.subscribePush(/* arguments */);
}
// Public function: unsubscribePush
if (typeof instance.unsubscribePush === 'function') {
  // const result = instance.unsubscribePush(/* arguments */);
}
// Public function: getPushSubscription
if (typeof instance.getPushSubscription === 'function') {
  // const result = instance.getPushSubscription(/* arguments */);
}
// Public function: generateManifest
if (typeof instance.generateManifest === 'function') {
  // const result = instance.generateManifest(/* arguments */);
}
// Public function: injectManifest
if (typeof instance.injectManifest === 'function') {
  // const result = instance.injectManifest(/* arguments */);
}
// Public function: postMessage
if (typeof instance.postMessage === 'function') {
  // const result = instance.postMessage(/* arguments */);
}
// Public function: onMessage
if (typeof instance.onMessage === 'function') {
  // const result = instance.onMessage(/* arguments */);
}
```

Implementation guide: [BareMetal.Progressive.md](BareMetal.Progressive.md)

## BareMetal.Pubsub

```html
<script src="src/BareMetal.PubSub.js"></script>
```

```js
const moduleApi = BareMetal.Pubsub;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: emit
if (typeof instance.emit === 'function') {
  // const result = instance.emit(/* arguments */);
}
// Public function: subscribe
if (typeof instance.subscribe === 'function') {
  // const result = instance.subscribe(/* arguments */);
}
```

Implementation guide: [BareMetal.Pubsub.md](BareMetal.Pubsub.md)

## BareMetal.RBAC

```html
<script src="src/BareMetal.RBAC.js"></script>
```

```js
const moduleApi = BareMetal.RBAC;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: WARNING
if (typeof instance.WARNING === 'function') {
  // const result = instance.WARNING(/* arguments */);
}
// Public function: configure
if (typeof instance.configure === 'function') {
  // const result = instance.configure(/* arguments */);
}
// Public function: identity
if (typeof instance.identity === 'function') {
  // const result = instance.identity(/* arguments */);
}
// Public function: isAuthenticated
if (typeof instance.isAuthenticated === 'function') {
  // const result = instance.isAuthenticated(/* arguments */);
}
// Public function: hasRole
if (typeof instance.hasRole === 'function') {
  // const result = instance.hasRole(/* arguments */);
}
// Public function: hasAnyRole
if (typeof instance.hasAnyRole === 'function') {
  // const result = instance.hasAnyRole(/* arguments */);
}
// Public function: hasAllRoles
if (typeof instance.hasAllRoles === 'function') {
  // const result = instance.hasAllRoles(/* arguments */);
}
// Public function: inGroup
if (typeof instance.inGroup === 'function') {
  // const result = instance.inGroup(/* arguments */);
}
// Public function: inAnyGroup
if (typeof instance.inAnyGroup === 'function') {
  // const result = instance.inAnyGroup(/* arguments */);
}
// Public function: inAllGroups
if (typeof instance.inAllGroups === 'function') {
  // const result = instance.inAllGroups(/* arguments */);
}
// Public function: can
if (typeof instance.can === 'function') {
  // const result = instance.can(/* arguments */);
}
// Public function: canAny
if (typeof instance.canAny === 'function') {
  // const result = instance.canAny(/* arguments */);
}
// Public function: canAll
if (typeof instance.canAll === 'function') {
  // const result = instance.canAll(/* arguments */);
}
// Public function: hasScope
if (typeof instance.hasScope === 'function') {
  // const result = instance.hasScope(/* arguments */);
}
// Public function: hasAnyScope
if (typeof instance.hasAnyScope === 'function') {
  // const result = instance.hasAnyScope(/* arguments */);
}
// Public function: check
if (typeof instance.check === 'function') {
  // const result = instance.check(/* arguments */);
}
// Public function: checkAny
if (typeof instance.checkAny === 'function') {
  // const result = instance.checkAny(/* arguments */);
}
// Public function: guard
if (typeof instance.guard === 'function') {
  // const result = instance.guard(/* arguments */);
}
// Public function: applyDOM
if (typeof instance.applyDOM === 'function') {
  // const result = instance.applyDOM(/* arguments */);
}
// Public function: setToken
if (typeof instance.setToken === 'function') {
  // const result = instance.setToken(/* arguments */);
}
// Public function: clearToken
if (typeof instance.clearToken === 'function') {
  // const result = instance.clearToken(/* arguments */);
}
// Public function: refresh
if (typeof instance.refresh === 'function') {
  // const result = instance.refresh(/* arguments */);
}
// Public function: onExpiry
if (typeof instance.onExpiry === 'function') {
  // const result = instance.onExpiry(/* arguments */);
}
// Public function: tenant
if (typeof instance.tenant === 'function') {
  // const result = instance.tenant(/* arguments */);
}
// Public function: isTenant
if (typeof instance.isTenant === 'function') {
  // const result = instance.isTenant(/* arguments */);
}
```

Implementation guide: [BareMetal.RBAC.md](BareMetal.RBAC.md)

## BareMetal.Rendering

```html
<script src="src/BareMetal.Rendering.js"></script>
```

```js
const moduleApi = BareMetal.Rendering;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: setRoot
if (typeof instance.setRoot === 'function') {
  // const result = instance.setRoot(/* arguments */);
}
// Public function: createNewEntity
if (typeof instance.createNewEntity === 'function') {
  // const result = instance.createNewEntity(/* arguments */);
}
// Public function: bind
if (typeof instance.bind === 'function') {
  // const result = instance.bind(/* arguments */);
}
// Public function: state
if (typeof instance.state === 'function') {
  // const result = instance.state(/* arguments */);
}
// Public function: listEntities
if (typeof instance.listEntities === 'function') {
  // const result = instance.listEntities(/* arguments */);
}
```

Implementation guide: [BareMetal.Rendering.md](BareMetal.Rendering.md)

## BareMetal.Ribbon

```html
<script src="src/BareMetal.Ribbon.js"></script>
```

```js
const moduleApi = BareMetal.Ribbon;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: el
if (typeof instance.el === 'function') {
  // const result = instance.el(/* arguments */);
}
// Public function: item
if (typeof instance.item === 'function') {
  // const result = instance.item(/* arguments */);
}
// Public function: setActive
if (typeof instance.setActive === 'function') {
  // const result = instance.setActive(/* arguments */);
}
// Public function: setDisabled
if (typeof instance.setDisabled === 'function') {
  // const result = instance.setDisabled(/* arguments */);
}
// Public function: setColour
if (typeof instance.setColour === 'function') {
  // const result = instance.setColour(/* arguments */);
}
// Public function: setFont
if (typeof instance.setFont === 'function') {
  // const result = instance.setFont(/* arguments */);
}
```

Implementation guide: [BareMetal.Ribbon.md](BareMetal.Ribbon.md)

## BareMetal.Routing

```html
<script src="src/BareMetal.Routing.js"></script>
```

```js
const moduleApi = BareMetal.Routing;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: pathname
if (typeof instance.pathname === 'function') {
  // const result = instance.pathname(/* arguments */);
}
// Public function: search
if (typeof instance.search === 'function') {
  // const result = instance.search(/* arguments */);
}
```

Implementation guide: [BareMetal.Routing.md](BareMetal.Routing.md)

## BareMetal.Scan

```html
<script src="src/BareMetal.Scan.js"></script>
```

```js
const moduleApi = BareMetal.Scan;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: text
if (typeof instance.text === 'function') {
  // const result = instance.text(/* arguments */);
}
// Public function: stop
if (typeof instance.stop === 'function') {
  // const result = instance.stop(/* arguments */);
}
```


## BareMetal.SceneInspector

```html
<script src="src/BareMetal.SceneInspector.js"></script>
```

```js
const moduleApi = BareMetal.SceneInspector;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```


## BareMetal.Schedule

```html
<script src="src/BareMetal.Schedule.js"></script>
```

```js
const moduleApi = BareMetal.Schedule;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: cron
if (typeof instance.cron === 'function') {
  // const result = instance.cron(/* arguments */);
}
// Public function: interval
if (typeof instance.interval === 'function') {
  // const result = instance.interval(/* arguments */);
}
// Public function: delay
if (typeof instance.delay === 'function') {
  // const result = instance.delay(/* arguments */);
}
// Public function: at
if (typeof instance.at === 'function') {
  // const result = instance.at(/* arguments */);
}
// Public function: every
if (typeof instance.every === 'function') {
  // const result = instance.every(/* arguments */);
}
// Public function: queue
if (typeof instance.queue === 'function') {
  // const result = instance.queue(/* arguments */);
}
// Public function: scheduler
if (typeof instance.scheduler === 'function') {
  // const result = instance.scheduler(/* arguments */);
}
// Public function: parseCron
if (typeof instance.parseCron === 'function') {
  // const result = instance.parseCron(/* arguments */);
}
// Public function: nextCron
if (typeof instance.nextCron === 'function') {
  // const result = instance.nextCron(/* arguments */);
}
// Public function: matchesCron
if (typeof instance.matchesCron === 'function') {
  // const result = instance.matchesCron(/* arguments */);
}
// Public function: parseDuration
if (typeof instance.parseDuration === 'function') {
  // const result = instance.parseDuration(/* arguments */);
}
// Public function: formatDuration
if (typeof instance.formatDuration === 'function') {
  // const result = instance.formatDuration(/* arguments */);
}
// Public function: debounce
if (typeof instance.debounce === 'function') {
  // const result = instance.debounce(/* arguments */);
}
// Public function: throttle
if (typeof instance.throttle === 'function') {
  // const result = instance.throttle(/* arguments */);
}
// Public function: rateLimit
if (typeof instance.rateLimit === 'function') {
  // const result = instance.rateLimit(/* arguments */);
}
// Public function: retry
if (typeof instance.retry === 'function') {
  // const result = instance.retry(/* arguments */);
}
// Public function: deadline
if (typeof instance.deadline === 'function') {
  // const result = instance.deadline(/* arguments */);
}
```


## BareMetal.Schema

```html
<script src="src/BareMetal.Schema.js"></script>
```

```js
const moduleApi = BareMetal.Schema;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: string
if (typeof instance.string === 'function') {
  // const result = instance.string(/* arguments */);
}
// Public function: number
if (typeof instance.number === 'function') {
  // const result = instance.number(/* arguments */);
}
// Public function: boolean
if (typeof instance.boolean === 'function') {
  // const result = instance.boolean(/* arguments */);
}
// Public function: array
if (typeof instance.array === 'function') {
  // const result = instance.array(/* arguments */);
}
// Public function: object
if (typeof instance.object === 'function') {
  // const result = instance.object(/* arguments */);
}
// Public function: date
if (typeof instance.date === 'function') {
  // const result = instance.date(/* arguments */);
}
// Public function: oneOf
if (typeof instance.oneOf === 'function') {
  // const result = instance.oneOf(/* arguments */);
}
// Public function: nullable
if (typeof instance.nullable === 'function') {
  // const result = instance.nullable(/* arguments */);
}
// Public function: optional
if (typeof instance.optional === 'function') {
  // const result = instance.optional(/* arguments */);
}
// Public function: parse
if (typeof instance.parse === 'function') {
  // const result = instance.parse(/* arguments */);
}
// Public function: validate
if (typeof instance.validate === 'function') {
  // const result = instance.validate(/* arguments */);
}
// Public function: transform
if (typeof instance.transform === 'function') {
  // const result = instance.transform(/* arguments */);
}
// Public function: coerce
if (typeof instance.coerce === 'function') {
  // const result = instance.coerce(/* arguments */);
}
// Public function: defaults
if (typeof instance.defaults === 'function') {
  // const result = instance.defaults(/* arguments */);
}
// Public function: extend
if (typeof instance.extend === 'function') {
  // const result = instance.extend(/* arguments */);
}
// Public function: pick
if (typeof instance.pick === 'function') {
  // const result = instance.pick(/* arguments */);
}
// Public function: omit
if (typeof instance.omit === 'function') {
  // const result = instance.omit(/* arguments */);
}
// Public function: partial
if (typeof instance.partial === 'function') {
  // const result = instance.partial(/* arguments */);
}
// Public function: version
if (typeof instance.version === 'function') {
  // const result = instance.version(/* arguments */);
}
// Public function: toJSON
if (typeof instance.toJSON === 'function') {
  // const result = instance.toJSON(/* arguments */);
}
// Public function: fromJSON
if (typeof instance.fromJSON === 'function') {
  // const result = instance.fromJSON(/* arguments */);
}
// Public function: custom
if (typeof instance.custom === 'function') {
  // const result = instance.custom(/* arguments */);
}
// Public function: toBinary
if (typeof instance.toBinary === 'function') {
  // const result = instance.toBinary(/* arguments */);
}
// Public function: fromBinary
if (typeof instance.fromBinary === 'function') {
  // const result = instance.fromBinary(/* arguments */);
}
```

Implementation guide: [BareMetal.Schema.md](BareMetal.Schema.md)

## BareMetal.Search

```html
<script src="src/BareMetal.Search.js"></script>
```

```js
const moduleApi = BareMetal.Search;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: docCount
if (typeof instance.docCount === 'function') {
  // const result = instance.docCount(/* arguments */);
}
// Public function: termCount
if (typeof instance.termCount === 'function') {
  // const result = instance.termCount(/* arguments */);
}
// Public function: avgDocLength
if (typeof instance.avgDocLength === 'function') {
  // const result = instance.avgDocLength(/* arguments */);
}
// Public function: indexSize
if (typeof instance.indexSize === 'function') {
  // const result = instance.indexSize(/* arguments */);
}
```


## BareMetal.SecureTransport

```html
<script src="src/BareMetal.SecureTransport.js"></script>
```

```js
const moduleApi = BareMetal.SecureTransport;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: setPublicKey
if (typeof instance.setPublicKey === 'function') {
  // const result = instance.setPublicKey(/* arguments */);
}
// Public function: loadPublicKey
if (typeof instance.loadPublicKey === 'function') {
  // const result = instance.loadPublicKey(/* arguments */);
}
// Public function: encryptObject
if (typeof instance.encryptObject === 'function') {
  // const result = instance.encryptObject(/* arguments */);
}
// Public function: decryptObject
if (typeof instance.decryptObject === 'function') {
  // const result = instance.decryptObject(/* arguments */);
}
// Public function: fetch
if (typeof instance.fetch === 'function') {
  // const result = instance.fetch(/* arguments */);
}
// Public function: getKeyId
if (typeof instance.getKeyId === 'function') {
  // const result = instance.getKeyId(/* arguments */);
}
// Public function: getTunnelUrl
if (typeof instance.getTunnelUrl === 'function') {
  // const result = instance.getTunnelUrl(/* arguments */);
}
```

Implementation guide: [BareMetal.SecureTransport.md](BareMetal.SecureTransport.md)

## BareMetal.ServiceWorker

```html
<script src="src/BareMetal.ServiceWorker.js"></script>
```

```js
const moduleApi = BareMetal.ServiceWorker;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.ServiceWorker.md](BareMetal.ServiceWorker.md)

## BareMetal.Session

```html
<script src="src/BareMetal.Session.js"></script>
```

```js
const moduleApi = BareMetal.Session;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: create
if (typeof instance.create === 'function') {
  // const result = instance.create(/* arguments */);
}
// Public function: tabSync
if (typeof instance.tabSync === 'function') {
  // const result = instance.tabSync(/* arguments */);
}
// Public function: guard
if (typeof instance.guard === 'function') {
  // const result = instance.guard(/* arguments */);
}
// Public function: fingerprint
if (typeof instance.fingerprint === 'function') {
  // const result = instance.fingerprint(/* arguments */);
}
// Public function: activity
if (typeof instance.activity === 'function') {
  // const result = instance.activity(/* arguments */);
}
```

Implementation guide: [BareMetal.Session.md](BareMetal.Session.md)

## BareMetal.Sheet

```html
<script src="src/BareMetal.Sheet.js"></script>
```

```js
const moduleApi = BareMetal.Sheet;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: el
if (typeof instance.el === 'function') {
  // const result = instance.el(/* arguments */);
}
// Public function: addr
if (typeof instance.addr === 'function') {
  // const result = instance.addr(/* arguments */);
}
// Public function: parseAddr
if (typeof instance.parseAddr === 'function') {
  // const result = instance.parseAddr(/* arguments */);
}
// Public function: getData
if (typeof instance.getData === 'function') {
  // const result = instance.getData(/* arguments */);
}
// Public function: setData
if (typeof instance.setData === 'function') {
  // const result = instance.setData(/* arguments */);
}
// Public function: getCell
if (typeof instance.getCell === 'function') {
  // const result = instance.getCell(/* arguments */);
}
// Public function: setCell
if (typeof instance.setCell === 'function') {
  // const result = instance.setCell(/* arguments */);
}
// Public function: select
if (typeof instance.select === 'function') {
  // const result = instance.select(/* arguments */);
}
// Public function: selected
if (typeof instance.selected === 'function') {
  // const result = instance.selected(/* arguments */);
}
// Public function: selectedRange
if (typeof instance.selectedRange === 'function') {
  // const result = instance.selectedRange(/* arguments */);
}
// Public function: styleSelected
if (typeof instance.styleSelected === 'function') {
  // const result = instance.styleSelected(/* arguments */);
}
// Public function: styleRange
if (typeof instance.styleRange === 'function') {
  // const result = instance.styleRange(/* arguments */);
}
// Public function: mergeSelected
if (typeof instance.mergeSelected === 'function') {
  // const result = instance.mergeSelected(/* arguments */);
}
// Public function: insertRow
if (typeof instance.insertRow === 'function') {
  // const result = instance.insertRow(/* arguments */);
}
// Public function: deleteRow
if (typeof instance.deleteRow === 'function') {
  // const result = instance.deleteRow(/* arguments */);
}
// Public function: insertCol
if (typeof instance.insertCol === 'function') {
  // const result = instance.insertCol(/* arguments */);
}
// Public function: deleteCol
if (typeof instance.deleteCol === 'function') {
  // const result = instance.deleteCol(/* arguments */);
}
// Public function: setRowFilter
if (typeof instance.setRowFilter === 'function') {
  // const result = instance.setRowFilter(/* arguments */);
}
// Public function: unmergeSelected
if (typeof instance.unmergeSelected === 'function') {
  // const result = instance.unmergeSelected(/* arguments */);
}
// Public function: startEdit
if (typeof instance.startEdit === 'function') {
  // const result = instance.startEdit(/* arguments */);
}
```

Implementation guide: [BareMetal.Sheet.md](BareMetal.Sheet.md)

## BareMetal.Speech

```html
<script src="src/BareMetal.Speech.js"></script>
```

```js
const moduleApi = BareMetal.Speech;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Speech.md](BareMetal.Speech.md)

## BareMetal.StateMachine

```html
<script src="src/BareMetal.StateMachine.js"></script>
```

```js
const moduleApi = BareMetal.StateMachine;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: send
if (typeof instance.send === 'function') {
  // const result = instance.send(/* arguments */);
}
// Public function: getState
if (typeof instance.getState === 'function') {
  // const result = instance.getState(/* arguments */);
}
// Public function: getContext
if (typeof instance.getContext === 'function') {
  // const result = instance.getContext(/* arguments */);
}
// Public function: matches
if (typeof instance.matches === 'function') {
  // const result = instance.matches(/* arguments */);
}
// Public function: subscribe
if (typeof instance.subscribe === 'function') {
  // const result = instance.subscribe(/* arguments */);
}
```

Implementation guide: [BareMetal.StateMachine.md](BareMetal.StateMachine.md)

## BareMetal.Story

```html
<script src="src/BareMetal.Story.js"></script>
```

```js
const moduleApi = BareMetal.Story;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: PACKS
if (typeof instance.PACKS === 'function') {
  // const result = instance.PACKS(/* arguments */);
}
// Public function: validateConditions
if (typeof instance.validateConditions === 'function') {
  // const result = instance.validateConditions(/* arguments */);
}
// Public function: validateEffects
if (typeof instance.validateEffects === 'function') {
  // const result = instance.validateEffects(/* arguments */);
}
// Public function: validateTriggers
if (typeof instance.validateTriggers === 'function') {
  // const result = instance.validateTriggers(/* arguments */);
}
// Public function: validateBaseFacts
if (typeof instance.validateBaseFacts === 'function') {
  // const result = instance.validateBaseFacts(/* arguments */);
}
// Public function: graphData
if (typeof instance.graphData === 'function') {
  // const result = instance.graphData(/* arguments */);
}
// Public function: memoryClient
if (typeof instance.memoryClient === 'function') {
  // const result = instance.memoryClient(/* arguments */);
}
// Public function: mount
if (typeof instance.mount === 'function') {
  // const result = instance.mount(/* arguments */);
}
```

Implementation guide: [BareMetal.Story.md](BareMetal.Story.md)

## BareMetal.Sync

```html
<script src="src/BareMetal.Sync.js"></script>
```

```js
const moduleApi = BareMetal.Sync;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: diff
if (typeof instance.diff === 'function') {
  // const result = instance.diff(/* arguments */);
}
// Public function: patch
if (typeof instance.patch === 'function') {
  // const result = instance.patch(/* arguments */);
}
// Public function: merge
if (typeof instance.merge === 'function') {
  // const result = instance.merge(/* arguments */);
}
// Public function: conflict
if (typeof instance.conflict === 'function') {
  // const result = instance.conflict(/* arguments */);
}
// Public function: resolve
if (typeof instance.resolve === 'function') {
  // const result = instance.resolve(/* arguments */);
}
// Public function: queue
if (typeof instance.queue === 'function') {
  // const result = instance.queue(/* arguments */);
}
// Public function: replay
if (typeof instance.replay === 'function') {
  // const result = instance.replay(/* arguments */);
}
// Public function: echo
if (typeof instance.echo === 'function') {
  // const result = instance.echo(/* arguments */);
}
// Public function: clock
if (typeof instance.clock === 'function') {
  // const result = instance.clock(/* arguments */);
}
// Public function: crdt
if (typeof instance.crdt === 'function') {
  // const result = instance.crdt(/* arguments */);
}
// Public function: version
if (typeof instance.version === 'function') {
  // const result = instance.version(/* arguments */);
}
// Public function: subscribe
if (typeof instance.subscribe === 'function') {
  // const result = instance.subscribe(/* arguments */);
}
// Public function: batch
if (typeof instance.batch === 'function') {
  // const result = instance.batch(/* arguments */);
}
```

Implementation guide: [BareMetal.Sync.md](BareMetal.Sync.md)

## BareMetal.Tabs

```html
<script src="src/BareMetal.Tabs.js"></script>
```

```js
const moduleApi = BareMetal.Tabs;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```


## BareMetal.Template

```html
<script src="src/BareMetal.Template.js"></script>
```

```js
const moduleApi = BareMetal.Template;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Template.md](BareMetal.Template.md)

## BareMetal.Tenant

```html
<script src="src/BareMetal.Tenant.js"></script>
```

```js
const moduleApi = BareMetal.Tenant;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: create
if (typeof instance.create === 'function') {
  // const result = instance.create(/* arguments */);
}
// Public function: current
if (typeof instance.current === 'function') {
  // const result = instance.current(/* arguments */);
}
// Public function: scope
if (typeof instance.scope === 'function') {
  // const result = instance.scope(/* arguments */);
}
// Public function: middleware
if (typeof instance.middleware === 'function') {
  // const result = instance.middleware(/* arguments */);
}
// Public function: store
if (typeof instance.store === 'function') {
  // const result = instance.store(/* arguments */);
}
// Public function: add
if (typeof instance.add === 'function') {
  // const result = instance.add(/* arguments */);
}
// Public function: get
if (typeof instance.get === 'function') {
  // const result = instance.get(/* arguments */);
}
// Public function: remove
if (typeof instance.remove === 'function') {
  // const result = instance.remove(/* arguments */);
}
// Public function: list
if (typeof instance.list === 'function') {
  // const result = instance.list(/* arguments */);
}
// Public function: find
if (typeof instance.find === 'function') {
  // const result = instance.find(/* arguments */);
}
// Public function: count
if (typeof instance.count === 'function') {
  // const result = instance.count(/* arguments */);
}
// Public function: config
if (typeof instance.config === 'function') {
  // const result = instance.config(/* arguments */);
}
// Public function: isolate
if (typeof instance.isolate === 'function') {
  // const result = instance.isolate(/* arguments */);
}
// Public function: partition
if (typeof instance.partition === 'function') {
  // const result = instance.partition(/* arguments */);
}
// Public function: hierarchy
if (typeof instance.hierarchy === 'function') {
  // const result = instance.hierarchy(/* arguments */);
}
// Public function: limits
if (typeof instance.limits === 'function') {
  // const result = instance.limits(/* arguments */);
}
// Public function: features
if (typeof instance.features === 'function') {
  // const result = instance.features(/* arguments */);
}
// Public function: onSwitch
if (typeof instance.onSwitch === 'function') {
  // const result = instance.onSwitch(/* arguments */);
}
// Public function: onChange
if (typeof instance.onChange === 'function') {
  // const result = instance.onChange(/* arguments */);
}
// Public function: impersonate
if (typeof instance.impersonate === 'function') {
  // const result = instance.impersonate(/* arguments */);
}
// Public function: export
if (typeof instance.export === 'function') {
  // const result = instance.export(/* arguments */);
}
// Public function: import
if (typeof instance.import === 'function') {
  // const result = instance.import(/* arguments */);
}
// Public function: resolve
if (typeof instance.resolve === 'function') {
  // const result = instance.resolve(/* arguments */);
}
// Public function: seal
if (typeof instance.seal === 'function') {
  // const result = instance.seal(/* arguments */);
}
// Public function: suspend
if (typeof instance.suspend === 'function') {
  // const result = instance.suspend(/* arguments */);
}
// Public function: activate
if (typeof instance.activate === 'function') {
  // const result = instance.activate(/* arguments */);
}
```


## BareMetal.TestRunner

```html
<script src="src/BareMetal.TestRunner.js"></script>
```

```js
const moduleApi = BareMetal.TestRunner;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: ok
if (typeof instance.ok === 'function') {
  // const result = instance.ok(/* arguments */);
}
// Public function: status
if (typeof instance.status === 'function') {
  // const result = instance.status(/* arguments */);
}
// Public function: url
if (typeof instance.url === 'function') {
  // const result = instance.url(/* arguments */);
}
// Public function: headers
if (typeof instance.headers === 'function') {
  // const result = instance.headers(/* arguments */);
}
// Public function: json
if (typeof instance.json === 'function') {
  // const result = instance.json(/* arguments */);
}
// Public function: text
if (typeof instance.text === 'function') {
  // const result = instance.text(/* arguments */);
}
// Public function: clone
if (typeof instance.clone === 'function') {
  // const result = instance.clone(/* arguments */);
}
```

Implementation guide: [BareMetal.TestRunner.md](BareMetal.TestRunner.md)

## BareMetal.ThemePicker

```html
<script src="src/BareMetal.ThemePicker.js"></script>
```

```js
const moduleApi = BareMetal.ThemePicker;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```


## BareMetal.Time

```html
<script src="src/BareMetal.Time.js"></script>
```

```js
const moduleApi = BareMetal.Time;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: days
if (typeof instance.days === 'function') {
  // const result = instance.days(/* arguments */);
}
// Public function: timeZone
if (typeof instance.timeZone === 'function') {
  // const result = instance.timeZone(/* arguments */);
}
// Public function: hour
if (typeof instance.hour === 'function') {
  // const result = instance.hour(/* arguments */);
}
// Public function: fractionalSecondDigits
if (typeof instance.fractionalSecondDigits === 'function') {
  // const result = instance.fractionalSecondDigits(/* arguments */);
}
// Public function: now
if (typeof instance.now === 'function') {
  // const result = instance.now(/* arguments */);
}
// Public function: format
if (typeof instance.format === 'function') {
  // const result = instance.format(/* arguments */);
}
// Public function: add
if (typeof instance.add === 'function') {
  // const result = instance.add(/* arguments */);
}
// Public function: isBefore
if (typeof instance.isBefore === 'function') {
  // const result = instance.isBefore(/* arguments */);
}
// Public function: diff
if (typeof instance.diff === 'function') {
  // const result = instance.diff(/* arguments */);
}
// Public function: daysInMonth
if (typeof instance.daysInMonth === 'function') {
  // const result = instance.daysInMonth(/* arguments */);
}
// Public function: dayOfWeek
if (typeof instance.dayOfWeek === 'function') {
  // const result = instance.dayOfWeek(/* arguments */);
}
// Public function: toTimezone
if (typeof instance.toTimezone === 'function') {
  // const result = instance.toTimezone(/* arguments */);
}
// Public function: hasTemporal
if (typeof instance.hasTemporal === 'function') {
  // const result = instance.hasTemporal(/* arguments */);
}
```

Implementation guide: [BareMetal.Time.md](BareMetal.Time.md)

## BareMetal.Timeline

```html
<script src="src/BareMetal.Timeline.js"></script>
```

```js
const moduleApi = BareMetal.Timeline;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```


## BareMetal.Tokens

```html
<script src="src/BareMetal.Tokens.js"></script>
```

```js
const moduleApi = BareMetal.Tokens;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: sign
if (typeof instance.sign === 'function') {
  // const result = instance.sign(/* arguments */);
}
// Public function: signSync
if (typeof instance.signSync === 'function') {
  // const result = instance.signSync(/* arguments */);
}
// Public function: decode
if (typeof instance.decode === 'function') {
  // const result = instance.decode(/* arguments */);
}
// Public function: verify
if (typeof instance.verify === 'function') {
  // const result = instance.verify(/* arguments */);
}
// Public function: isExpired
if (typeof instance.isExpired === 'function') {
  // const result = instance.isExpired(/* arguments */);
}
// Public function: expiresIn
if (typeof instance.expiresIn === 'function') {
  // const result = instance.expiresIn(/* arguments */);
}
// Public function: claim
if (typeof instance.claim === 'function') {
  // const result = instance.claim(/* arguments */);
}
// Public function: generateSecret
if (typeof instance.generateSecret === 'function') {
  // const result = instance.generateSecret(/* arguments */);
}
// Public function: generateKeyPair
if (typeof instance.generateKeyPair === 'function') {
  // const result = instance.generateKeyPair(/* arguments */);
}
// Public function: importKey
if (typeof instance.importKey === 'function') {
  // const result = instance.importKey(/* arguments */);
}
// Public function: exportKey
if (typeof instance.exportKey === 'function') {
  // const result = instance.exportKey(/* arguments */);
}
// Public function: importJWK
if (typeof instance.importJWK === 'function') {
  // const result = instance.importJWK(/* arguments */);
}
// Public function: create
if (typeof instance.create === 'function') {
  // const result = instance.create(/* arguments */);
}
// Public function: parseDuration
if (typeof instance.parseDuration === 'function') {
  // const result = instance.parseDuration(/* arguments */);
}
// Public function: toBase64Url
if (typeof instance.toBase64Url === 'function') {
  // const result = instance.toBase64Url(/* arguments */);
}
// Public function: fromBase64Url
if (typeof instance.fromBase64Url === 'function') {
  // const result = instance.fromBase64Url(/* arguments */);
}
```

Implementation guide: [BareMetal.Tokens.md](BareMetal.Tokens.md)

## BareMetal.Transport

```html
<script src="src/BareMetal.Transport.js"></script>
```

```js
const moduleApi = BareMetal.Transport;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: retry
if (typeof instance.retry === 'function') {
  // const result = instance.retry(/* arguments */);
}
// Public function: backoff
if (typeof instance.backoff === 'function') {
  // const result = instance.backoff(/* arguments */);
}
// Public function: idempotencyKey
if (typeof instance.idempotencyKey === 'function') {
  // const result = instance.idempotencyKey(/* arguments */);
}
// Public function: dedupe
if (typeof instance.dedupe === 'function') {
  // const result = instance.dedupe(/* arguments */);
}
// Public function: coalesce
if (typeof instance.coalesce === 'function') {
  // const result = instance.coalesce(/* arguments */);
}
// Public function: cancel
if (typeof instance.cancel === 'function') {
  // const result = instance.cancel(/* arguments */);
}
// Public function: timeout
if (typeof instance.timeout === 'function') {
  // const result = instance.timeout(/* arguments */);
}
// Public function: fetchWithTimeout
if (typeof instance.fetchWithTimeout === 'function') {
  // const result = instance.fetchWithTimeout(/* arguments */);
}
// Public function: fetchWithRetry
if (typeof instance.fetchWithRetry === 'function') {
  // const result = instance.fetchWithRetry(/* arguments */);
}
// Public function: race
if (typeof instance.race === 'function') {
  // const result = instance.race(/* arguments */);
}
// Public function: cache
if (typeof instance.cache === 'function') {
  // const result = instance.cache(/* arguments */);
}
// Public function: priority
if (typeof instance.priority === 'function') {
  // const result = instance.priority(/* arguments */);
}
// Public function: queue
if (typeof instance.queue === 'function') {
  // const result = instance.queue(/* arguments */);
}
// Public function: circuit
if (typeof instance.circuit === 'function') {
  // const result = instance.circuit(/* arguments */);
}
// Public function: rateLimit
if (typeof instance.rateLimit === 'function') {
  // const result = instance.rateLimit(/* arguments */);
}
```

Implementation guide: [BareMetal.Transport.md](BareMetal.Transport.md)

## BareMetal.Types

```html
<script src="src/BareMetal.Types.js"></script>
```

```js
const moduleApi = BareMetal.Types;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: name
if (typeof instance.name === 'function') {
  // const result = instance.name(/* arguments */);
}
// Public function: fields
if (typeof instance.fields === 'function') {
  // const result = instance.fields(/* arguments */);
}
// Public function: methods
if (typeof instance.methods === 'function') {
  // const result = instance.methods(/* arguments */);
}
// Public function: ancestors
if (typeof instance.ancestors === 'function') {
  // const result = instance.ancestors(/* arguments */);
}
// Public function: serializable
if (typeof instance.serializable === 'function') {
  // const result = instance.serializable(/* arguments */);
}
```

Implementation guide: [BareMetal.Types.md](BareMetal.Types.md)

## BareMetal.UndoRedo

```html
<script src="src/BareMetal.UndoRedo.js"></script>
```

```js
const moduleApi = BareMetal.UndoRedo;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.UndoRedo.md](BareMetal.UndoRedo.md)

## BareMetal.URL

```html
<script src="src/BareMetal.URL.js"></script>
```

```js
const moduleApi = BareMetal.URL;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: parse
if (typeof instance.parse === 'function') {
  // const result = instance.parse(/* arguments */);
}
// Public function: build
if (typeof instance.build === 'function') {
  // const result = instance.build(/* arguments */);
}
// Public function: query
if (typeof instance.query === 'function') {
  // const result = instance.query(/* arguments */);
}
// Public function: encode
if (typeof instance.encode === 'function') {
  // const result = instance.encode(/* arguments */);
}
// Public function: decode
if (typeof instance.decode === 'function') {
  // const result = instance.decode(/* arguments */);
}
// Public function: merge
if (typeof instance.merge === 'function') {
  // const result = instance.merge(/* arguments */);
}
// Public function: remove
if (typeof instance.remove === 'function') {
  // const result = instance.remove(/* arguments */);
}
// Public function: params
if (typeof instance.params === 'function') {
  // const result = instance.params(/* arguments */);
}
// Public function: template
if (typeof instance.template === 'function') {
  // const result = instance.template(/* arguments */);
}
// Public function: join
if (typeof instance.join === 'function') {
  // const result = instance.join(/* arguments */);
}
// Public function: normalize
if (typeof instance.normalize === 'function') {
  // const result = instance.normalize(/* arguments */);
}
// Public function: isAbsolute
if (typeof instance.isAbsolute === 'function') {
  // const result = instance.isAbsolute(/* arguments */);
}
// Public function: isRelative
if (typeof instance.isRelative === 'function') {
  // const result = instance.isRelative(/* arguments */);
}
// Public function: resolve
if (typeof instance.resolve === 'function') {
  // const result = instance.resolve(/* arguments */);
}
// Public function: compare
if (typeof instance.compare === 'function') {
  // const result = instance.compare(/* arguments */);
}
// Public function: slug
if (typeof instance.slug === 'function') {
  // const result = instance.slug(/* arguments */);
}
// Public function: hash
if (typeof instance.hash === 'function') {
  // const result = instance.hash(/* arguments */);
}
// Public function: get
if (typeof instance.get === 'function') {
  // const result = instance.get(/* arguments */);
}
// Public function: set
if (typeof instance.set === 'function') {
  // const result = instance.set(/* arguments */);
}
// Public function: origin
if (typeof instance.origin === 'function') {
  // const result = instance.origin(/* arguments */);
}
// Public function: isValid
if (typeof instance.isValid === 'function') {
  // const result = instance.isValid(/* arguments */);
}
// Public function: relative
if (typeof instance.relative === 'function') {
  // const result = instance.relative(/* arguments */);
}
```

Implementation guide: [BareMetal.URL.md](BareMetal.URL.md)

## BareMetal.Validate

```html
<script src="src/BareMetal.Validate.js"></script>
```

```js
const moduleApi = BareMetal.Validate;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Validate.md](BareMetal.Validate.md)

## BareMetal.Vector

```html
<script src="src/BareMetal.Vector.js"></script>
```

```js
const moduleApi = BareMetal.Vector;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: createCollection
if (typeof instance.createCollection === 'function') {
  // const result = instance.createCollection(/* arguments */);
}
// Public function: upsert
if (typeof instance.upsert === 'function') {
  // const result = instance.upsert(/* arguments */);
}
// Public function: remove
if (typeof instance.remove === 'function') {
  // const result = instance.remove(/* arguments */);
}
// Public function: count
if (typeof instance.count === 'function') {
  // const result = instance.count(/* arguments */);
}
// Public function: search
if (typeof instance.search === 'function') {
  // const result = instance.search(/* arguments */);
}
// Public function: clear
if (typeof instance.clear === 'function') {
  // const result = instance.clear(/* arguments */);
}
```


## BareMetal.Vectorsearch

```html
<script src="src/BareMetal.VectorSearch.js"></script>
```

```js
const moduleApi = BareMetal.Vectorsearch;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: upsert
if (typeof instance.upsert === 'function') {
  // const result = instance.upsert(/* arguments */);
}
// Public function: remove
if (typeof instance.remove === 'function') {
  // const result = instance.remove(/* arguments */);
}
// Public function: has
if (typeof instance.has === 'function') {
  // const result = instance.has(/* arguments */);
}
// Public function: get
if (typeof instance.get === 'function') {
  // const result = instance.get(/* arguments */);
}
// Public function: size
if (typeof instance.size === 'function') {
  // const result = instance.size(/* arguments */);
}
// Public function: clear
if (typeof instance.clear === 'function') {
  // const result = instance.clear(/* arguments */);
}
// Public function: topK
if (typeof instance.topK === 'function') {
  // const result = instance.topK(/* arguments */);
}
// Public function: dims
if (typeof instance.dims === 'function') {
  // const result = instance.dims(/* arguments */);
}
```


## BareMetal.VTTerminal

```html
<script src="src/BareMetal.VTTerminal.js"></script>
```

```js
const moduleApi = BareMetal.VTTerminal;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: element
if (typeof instance.element === 'function') {
  // const result = instance.element(/* arguments */);
}
// Public function: write
if (typeof instance.write === 'function') {
  // const result = instance.write(/* arguments */);
}
// Public function: clear
if (typeof instance.clear === 'function') {
  // const result = instance.clear(/* arguments */);
}
// Public function: resize
if (typeof instance.resize === 'function') {
  // const result = instance.resize(/* arguments */);
}
// Public function: send
if (typeof instance.send === 'function') {
  // const result = instance.send(/* arguments */);
}
// Public function: openWebSocket
if (typeof instance.openWebSocket === 'function') {
  // const result = instance.openWebSocket(/* arguments */);
}
// Public function: onInput
if (typeof instance.onInput === 'function') {
  // const result = instance.onInput(/* arguments */);
}
// Public function: getLines
if (typeof instance.getLines === 'function') {
  // const result = instance.getLines(/* arguments */);
}
// Public function: destroy
if (typeof instance.destroy === 'function') {
  // const result = instance.destroy(/* arguments */);
}
```

Implementation guide: [BareMetal.VTTerminal.md](BareMetal.VTTerminal.md)

## BareMetal.Workers

```html
<script src="src/BareMetal.Workers.js"></script>
```

```js
const moduleApi = BareMetal.Workers;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Consult the module source or implementation guide for arguments.
```

Implementation guide: [BareMetal.Workers.md](BareMetal.Workers.md)

## BareMetal.Workflow

```html
<script src="src/BareMetal.Workflow.js"></script>
```

```js
const moduleApi = BareMetal.Workflow;
const instance = typeof moduleApi.create === 'function' ? moduleApi.create({}) : moduleApi;
// Public function: VERSION
if (typeof instance.VERSION === 'function') {
  // const result = instance.VERSION(/* arguments */);
}
// Public function: create
if (typeof instance.create === 'function') {
  // const result = instance.create(/* arguments */);
}
// Public function: mount
if (typeof instance.mount === 'function') {
  // const result = instance.mount(/* arguments */);
}
// Public function: parseTree
if (typeof instance.parseTree === 'function') {
  // const result = instance.parseTree(/* arguments */);
}
// Public function: serialize
if (typeof instance.serialize === 'function') {
  // const result = instance.serialize(/* arguments */);
}
// Public function: WORKFLOW_TYPES
if (typeof instance.WORKFLOW_TYPES === 'function') {
  // const result = instance.WORKFLOW_TYPES(/* arguments */);
}
```

Implementation guide: [BareMetal.Workflow.md](BareMetal.Workflow.md)
