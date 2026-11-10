# BareMetalJsTools API Library

Generated implementation and function-calling catalog.

| Module | Browser load | Public API | Documentation |
|---|---|---|---|
| [BareMetal.3DXR](BareMetal.3DXR.md) | `<script src="src/BareMetal.3DXR.js"></script>` | `BareMetal['3DXR'].create(canvas, options)`, `renderer.addVideo(options)` | [BareMetal.3DXR](BareMetal.3DXR.md) |
| [BareMetal.A11y](BareMetal.A11y.md) | `<script src="src/BareMetal.A11y.js"></script>` | `focusTrap(container, opts)`, `announce(text, priority)`, `skipNav(targetId)`, `roving(container, selector, opts)`, `prefersReducedMotion()`, `prefersColorScheme()`, `onMotionChange(fn)`, `onSchemeChange(fn)`, `focusTrap()`, `roving()` | [BareMetal.A11y](BareMetal.A11y.md) |
| [BareMetal.AI](BareMetal.AI.md) | `<script src="src/BareMetal.AI.js"></script>` | `create(options)`, `client.stream(messages, options)`, `client.run(messages, options)` | [BareMetal.AI](BareMetal.AI.md) |
| [BareMetal.Animate](BareMetal.Animate.md) | `<script src="src/BareMetal.Animate.js"></script>` | `enter(el, className, done)`, `leave(el, className, done)`, `toggle(el, enterClass, leaveClass)`, `move(el, fromRect, toRect)`, `list(container, className)`, `prefersReducedMotion()` | [BareMetal.Animate](BareMetal.Animate.md) |
| [BareMetal.AudioMixer](modules/BareMetal.AudioMixer.md) | `<script src="src/BareMetal.AudioMixer.js"></script>` | `create(options)` | [BareMetal.AudioMixer](modules/BareMetal.AudioMixer.md) |
| [BareMetal.Auth](BareMetal.Auth.md) | `<script src="src/BareMetal.Auth.js"></script>` | `configure(options)`, `initialize()`, `login(extraParams)`, `handleCallback(url)`, `logout()`, `clearSession()`, `getToken()`, `getIdToken()`, `silentRefresh()`, `handleSilentCallback()`, `getUser()`, `getUserInfo()`, `isAuthenticated()`, `onAuthChange(callback)`, `attachToRest()`, `_setRedirect(fn)`, `renderLogin(container, options)`, `renderLogout(container, options)`, `renderWhoami(container, options)`, `renderTokenInspector(container, options)`, `renderUserTiles(container, options)`, `renderAuthGate(container, options)`, `configure()`, `login()`, `renderLogin()`, `renderLogout()`, `renderWhoami()`, `renderTokenInspector()`, `renderUserTiles()`, `renderAuthGate()` | [BareMetal.Auth](BareMetal.Auth.md) |
| [BareMetal.Authenticator](modules/BareMetal.Authenticator.md) | `<script src="src/BareMetal.Authenticator.js"></script>` | `setup(userId, options)`, `verify(code, secret, options)`, `generate(secret, options)`, `challenge(session, options)`, `protect(fn, options)`, `replayGuard(secret, options)`, `backupVerify(code, backupCodes)`, `qrSvg(uri, options)` | [BareMetal.Authenticator](modules/BareMetal.Authenticator.md) |
| [BareMetal.Binary](BareMetal.Binary.md) | `<script src="src/BareMetal.Binary.js"></script>` | `setSigningKey(base64Key)`, `setSigningKeyBytes(keyBytes)`, `fetchSchema(slug, apiRoot)`, `getCachedSchema(slug)`, `serialize(object, schema)`, `deserialize(buffer, schema)`, `deserializeList(buffer, schema)`, `verifySignature(payload)`, `fetchLayout(slug)`, `createTracker(entity, layout)`, `buildDelta(tracker, layout)`, `applyDelta(slug, entityId, deltaBuffer)`, `applyDeltaJson(slug, entityId, changes, expectedVersion = 0)`, `SpanReader`, `new BareMetal.Binary.SpanReader(buffer)`, `SpanWriter`, `new BareMetal.Binary.SpanWriter(size = 256)` | [BareMetal.Binary](BareMetal.Binary.md) |
| [BareMetal.Bind](BareMetal.Bind.md) | `<script src="src/BareMetal.Bind.js"></script>` | `reactive(initial)`, `bind(root, state, watch)`, `formatters`, `getPath(obj, path)`, `setPath(obj, path, value)`, `topKey(path)`, `parseBinding(expr)`, `applyPipes(value, pipes)`, `resolveInScope(path, state, scope)`, `resolveBinding(expr, state, scope)`, `parsePairs(attr)`, `applyRow(el, state, scope)`, `el(tag, className)`, `m-each` | [BareMetal.Bind](BareMetal.Bind.md) |
| [BareMetal.Blob](modules/BareMetal.Blob.md) | `<script src="src/BareMetal.Blob.js"></script>` | `usage(options)`, `create(options)`, `chunk(blob, options)`, `upload(blob, options)`, `resume(token, options)`, `download(id, options)`, `hash(blob, options)`, `store(adapter)`, `lifecycle(options)`, `transform(blob, options)`, `encrypt(blob, key)`, `decrypt(blob, key)` | [BareMetal.Blob](modules/BareMetal.Blob.md) |
| [BareMetal.Cache](BareMetal.Cache.md) | `<script src="src/BareMetal.Cache.js"></script>` | `create(opts)`, `tiered(levels)`, `lru(maxSize)`, `memoize(fn, opts)` | [BareMetal.Cache](BareMetal.Cache.md) |
| [BareMetal.Capabilities](BareMetal.Capabilities.md) | `<script src="src/BareMetal.Capabilities.js"></script>` | `detect(feature)`, `detectAll(features)`, `profile()`, `supports(feature, fallbackValue)`, `fallback(...options)`, `permission(name)`, `requestPermission(name)`, `register(name, detectFn)`, `require(features)`, `degrade(features, levels)`, `onChange(callback)`, `constraints()`, `score()`, `compare(required, available)` | [BareMetal.Capabilities](BareMetal.Capabilities.md) |
| [BareMetal.Charts](BareMetal.Charts.md) | `<script src="src/BareMetal.Charts.js"></script>` | `bar(target, data, options)`, `line(target, data, options)`, `sparkline(target, values, options)`, `donut(target, data, options)`, `gauge(target, value, options)` | [BareMetal.Charts](BareMetal.Charts.md) |
| [BareMetal.Clipboard](BareMetal.Clipboard.md) | `<script src="src/BareMetal.Clipboard.js"></script>` | `writeText(text)`, `readText()`, `write(list)`, `read()`, `copy(text, options)`, `copyFrom(element, options)`, `copyImage(node)`, `readImage()`, `onPaste(element, callback)`, `onPasteFiles(element, callback)`, `onPasteImage(element, callback)`, `cut(element)`, `checkPermission(name)`, `requestPermission(name)`, `isSupported()`, `isSecureContext()` | [BareMetal.Clipboard](BareMetal.Clipboard.md) |
| [BareMetal.Codes](BareMetal.Codes.md) | `<script src="src/BareMetal.Codes.js"></script>` | `countries`, `currencies`, `days`, `months`, `languages`, `timezones`, `http`, `mime`, `colours`, `cards`, `units`, `subdivisions(code)` | [BareMetal.Codes](BareMetal.Codes.md) |
| [BareMetal.Colour](BareMetal.Colour.md) | `<script src="src/BareMetal.Colour.js"></script>` | `el`, `get`, `set`, `open`, `close` | [BareMetal.Colour](BareMetal.Colour.md) |
| [BareMetal.Communications](BareMetal.Communications.md) | `<script src="src/BareMetal.Communications.js"></script>` | `setRoot(root)`, `getRoot()`, `init()`, `call(method, url, body)`, `entity(slug)`, `entityClient.list(query)`, `entityClient.get(id)`, `entityClient.create(data)`, `entityClient.update(id, data)`, `entityClient.remove(id)`, `entityClient.delta(id, changes, expectedVersion = 0)`, `entityClient.deltaFromTracker(tracker)`, `entityClient.metadata()`, `byId(routeId, options)`, `resolveRouteId(verb, path)`, `connectWs(url)`, `isWsReady()`, `ensureBinary()`, `isBinaryAvailable()`, `walStream(entityName)`, `walStreamAll()`, `setCompression(options)`, `getCompression()` | [BareMetal.Communications](BareMetal.Communications.md) |
| [BareMetal.ComponentFactories](BareMetal.ComponentFactories.md) | `<script src="src/BareMetal.ComponentFactories.js"></script>` | `create.message(text, opts)`, `create.botMessage(text, opts)`, `create.toast(message, opts)`, `create.calendarEvent(date, label, opts)`, `create.ganttTask(label, start, end, opts)`, `create.treeNode(label, opts)`, `create.tableRow(obj)`, `create.navLink(text, href, opts)`, `create.navDropdown(title, ...links)`, `create.listItem(key, data)`, `chatEndpoint(messagesKey, url, opts)`, `chatEndpoint()` | [BareMetal.ComponentFactories](BareMetal.ComponentFactories.md) |
| [BareMetal.Components](BareMetal.Components.md) | `<script src="src/BareMetal.Components.js"></script>` | `bindComponents(root, state, watch)`, `m-img`, `m-chatbot`, `m-calendar`, `m-gantt`, `m-table`, `m-tree`, `m-entity` | [BareMetal.Components](BareMetal.Components.md) |
| [BareMetal.Compress](BareMetal.Compress.md) | `<script src="src/BareMetal.Compress.js"></script>` | `compress(input, options)`, `decompress(input)`, `compressBound(inputLength)`, `PROFILES`, `compress()` | [BareMetal.Compress](BareMetal.Compress.md) |
| [BareMetal.Config](BareMetal.Config.md) | `<script src="src/BareMetal.Config.js"></script>` | `create(opts)`, `priorities` | [BareMetal.Config](BareMetal.Config.md) |
| [BareMetal.ControlSurface](modules/BareMetal.ControlSurface.md) | `<script src="src/BareMetal.ControlSurface.js"></script>` | `create(options)` | [BareMetal.ControlSurface](modules/BareMetal.ControlSurface.md) |
| [BareMetal.Controls](BareMetal.Controls.md) | `<script src="src/BareMetal.Controls.js"></script>` | `<module API>` | [BareMetal.Controls](BareMetal.Controls.md) |
| [BareMetal.Crypto](BareMetal.Crypto.md) | `<script src="src/BareMetal.Crypto.js"></script>` | `generateSymmetricKey(extractable)`, `encryptSymmetric(key, data)`, `decryptSymmetric(key, iv, ciphertext)`, `generateAsymmetricKey(bits, extractable)`, `encryptAsymmetric(publicKey, data)`, `decryptAsymmetric(privateKey, envelope)`, `digest(data)`, `digestWithSalt(data, salt)`, `deriveKey(password, salt, iterations)`, `generateSigningKey(extractable)`, `sign(privateKey, data)`, `verifySignature(publicKey, data, signature)`, `exportKey(key, format = 'jwk')`, `importKey(keyData, algorithm, usages, format = 'jwk', extractable)`, `toBase64Url(buffer)`, `fromBase64Url(string)`, `toUtf8(string)`, `fromUtf8(buffer)`, `randomBytes(length)` | [BareMetal.Crypto](BareMetal.Crypto.md) |
| [BareMetal.DataGrid](BareMetal.DataGrid.md) | `<script src="src/BareMetal.DataGrid.js"></script>` | `create(target, options)`, `grid.loadPage(page)`, `grid.setRows(rows)`, `grid.setPageSize(size)`, `grid.setSort(key, direction)`, `grid.setFilters(filters)`, `grid.getState()`, `grid.selected()`, `grid.clearSelection()`, `grid.bulkEdit(patch)`, `grid.destroy()` | [BareMetal.DataGrid](BareMetal.DataGrid.md) |
| [BareMetal.Diagnostics](BareMetal.Diagnostics.md) | `<script src="src/BareMetal.Diagnostics.js"></script>` | `trace(name, fn)`, `span(name, opts)`, `timeline()`, `inspect(value, opts)`, `why(value, history)`, `watch(target, path, callback)`, `perf`, `counter(name)`, `gauge(name, fn)`, `report()`, `enable()`, `disable()`, `hook(moduleName, instance)` | [BareMetal.Diagnostics](BareMetal.Diagnostics.md) |
| [BareMetal.DJDeck](BareMetal.DJDeck.md) | `<script src="src/BareMetal.DJDeck.js"></script>` | `bpm`, `track`, `playing`, `elapsed`, `remaining`, `duration`, `beatGrid`, `waveform`, `hotCues`, `cuePoint`, `loop`, `pitchSemitones`, `tempoPercent`, `playbackRate` | [BareMetal.DJDeck](BareMetal.DJDeck.md) |
| [BareMetal.DJLibrary](BareMetal.DJLibrary.md) | `<script src="src/BareMetal.DJLibrary.js"></script>` | `saveTrack`, `getTrack`, `listTracks`, `deleteTrack`, `search`, `saveCues`, `getCues`, `savePlaylist`, `getPlaylist`, `saveSetting`, `getSetting` | [BareMetal.DJLibrary](BareMetal.DJLibrary.md) |
| [BareMetal.DJMixer](BareMetal.DJMixer.md) | `<script src="src/BareMetal.DJMixer.js"></script>` | `enabled`, `mix`, `gain`, `channels` | [BareMetal.DJMixer](BareMetal.DJMixer.md) |
| [BareMetal.DocChain](modules/BareMetal.DocChain.md) | `<script src="src/BareMetal.DocChain.js"></script>` | `defineType(name, schema)`, `create(type, data, options)`, `derive(parent, type, data)`, `transition(document, status)`, `validate(document)`, `lineage(id)`, `auditTrail(id)`, `store` | [BareMetal.DocChain](modules/BareMetal.DocChain.md) |
| [BareMetal.Document](BareMetal.Document.md) | `<script src="src/BareMetal.Document.js"></script>` | `el`, `page`, `getHTML`, `setHTML`, `command`, `bold`, `italic`, `underline`, `heading`, `paragraph`, `list`, `color`, `hilite`, `font`, `fontSize`, `query` | [BareMetal.Document](BareMetal.Document.md) |
| [BareMetal.DocumentRenderer](BareMetal.DocumentRenderer.md) | `<script src="src/BareMetal.DocumentRenderer.js"></script>` | `isSupported()`, `sanitizeHTML(html)`, `pageBreak()`, `render(html, options)`, `download(html, filename, options)` | [BareMetal.DocumentRenderer](BareMetal.DocumentRenderer.md) |
| [BareMetal.DocumentWAL](BareMetal.DocumentWAL.md) | `<script src="src/BareMetal.DocumentWAL.js"></script>` | `create(options)`, `memoryTransport(seed?)`, `httpTransport(root)` | [BareMetal.DocumentWAL](BareMetal.DocumentWAL.md) |
| [BareMetal.DragDrop](BareMetal.DragDrop.md) | `<script src="src/BareMetal.DragDrop.js"></script>` | `draggable(el, opts)`, `droppable(el, opts)`, `sortable(container, opts)` | [BareMetal.DragDrop](BareMetal.DragDrop.md) |
| [BareMetal.Errors](BareMetal.Errors.md) | `<script src="src/BareMetal.Errors.js"></script>` | `new BareMetalError(code, message, opts)`, `create(code, message, opts)`, `classify(err)`, `isRetryable(err)`, `isTransient(err)`, `chain(err, cause)`, `getChain(err)`, `toUserSafe(err)`, `toJSON(err)`, `fromJSON(obj)`, `wrap(fn, opts)`, `assert(condition, code, message)`, `codes.register(code, defaults)`, `codes.lookup(code)`, `match(err, handlers)`, `aggregate(errors)`, `boundary(fn, fallback)` | [BareMetal.Errors](BareMetal.Errors.md) |
| [BareMetal.Expressions](BareMetal.Expressions.md) | `<script src="src/BareMetal.Expressions.js"></script>` | `list()`, `info(name)`, `detect(value)`, `register(name, cfg)`, `register()` | [BareMetal.Expressions](BareMetal.Expressions.md) |
| [BareMetal.FileIO](BareMetal.FileIO.md) | `<script src="src/BareMetal.FileIO.js"></script>` | `open(options)`, `openText(options)`, `openJSON(options)`, `openBinary(options)`, `openDataURL(options)`, `openDirectory()`, `save(content, options)`, `download(content, filename, type)`, `downloadUrl(url, filename)`, `dropZone(element, options)`, `readAsText(file, encoding)`, `readAsJSON(file)`, `readAsArrayBuffer(file)`, `readAsDataURL(file)`, `readChunked(file, options)`, `stream(file)`, `pick(options)`, `formatSize(bytes)`, `ext(name)`, `isImage(file)`, `isVideo(file)`, `isAudio(file)`, `isPDF(file)`, `slice(file, start, end)`, `blobToArrayBuffer(blob)`, `blobToText(blob)`, `blobToDataURL(blob)`, `textToBlob(text, type)`, `arrayBufferToBlob(buffer, type)`, `hasFileSystemAccess()`, `hasDragDrop()` | [BareMetal.FileIO](BareMetal.FileIO.md) |
| [BareMetal.Font](BareMetal.Font.md) | `<script src="src/BareMetal.Font.js"></script>` | `el`, `get`, `set` | [BareMetal.Font](BareMetal.Font.md) |
| [BareMetal.FooterBar](BareMetal.FooterBar.md) | `<script src="src/BareMetal.FooterBar.js"></script>` | `el`, `setStatus`, `setTabs`, `setZoom`, `getZoom` | [BareMetal.FooterBar](BareMetal.FooterBar.md) |
| [BareMetal.Forms](BareMetal.Forms.md) | `<script src="src/BareMetal.Forms.js"></script>` | `create(form, schema)`, `formApi.validate()`, `formApi.getValues()`, `formApi.setValues(obj)`, `formApi.reset()`, `formApi.destroy()`, `formApi.onSubmit(cb)`, `formApi.onChange(cb)`, `formApi.getState()`, `getState(form)`, `serialize(form)`, `deserialize(form, data)`, `validate(root, rules)`, `mask(input, pattern)`, `wizard(container, steps)`, `wizardApi.next()`, `wizardApi.getCurrentStep()`, `wizardApi.isFirst()`, `wizardApi.onStep(cb)`, `wizardApi.submit()`, `repeater(container, opts)`, `repeaterApi.add(data)`, `repeaterApi.remove(index)`, `repeaterApi.getAll()`, `repeaterApi.onAdd(cb)`, `repeaterApi.destroy()`, `autosave(form, opts)`, `autosaveApi.restore()`, `autosaveApi.clear()`, `conditional(form, rules)`, `submit(form, handler, opts)`, `fromJSON(container, schema)`, `toFormData(form)`, `diff(form)`, `focus(form, opts)` | [BareMetal.Forms](BareMetal.Forms.md) |
| [BareMetal.Gallery](BareMetal.Gallery.md) | `<script src="src/BareMetal.Gallery.js"></script>` | `<module API>` | [BareMetal.Gallery](BareMetal.Gallery.md) |
| [BareMetal.Gamepad](BareMetal.Gamepad.md) | `<script src="src/BareMetal.Gamepad.js"></script>` | `poll()`, `on(event, callback)`, `off(event, callback)`, `start(opts)`, `stop()`, `getState(index)`, `isPressed(index, button)`, `getAxis(index, axisIndex)`, `vibrate(index, opts)`, `map(index, mapping)`, `combo(index, sequence, callback, opts)`, `combo.cancel()`, `deadzone(value, threshold)`, `normalize(gamepad)`, `profiles` | [BareMetal.Gamepad](BareMetal.Gamepad.md) |
| [BareMetal.Geo](BareMetal.Geo.md) | `<script src="src/BareMetal.Geo.js"></script>` | `getCurrentPosition(opts)`, `watchPosition(callback, opts)`, `clearWatch(watchId)`, `distance(p1, p2)`, `bearing(p1, p2)`, `midpoint(p1, p2)`, `boundingBox(center, radiusMeters)`, `isInside(point, polygon)`, `encode(lat, lng, precision)`, `decode(hash)`, `track(opts)`, `tracker.start()`, `tracker.stop()`, `tracker.getPath()`, `tracker.getDistance()`, `tracker.onUpdate(cb)`, `geocode(address)`, `reverseGeocode(lat, lng)` | [BareMetal.Geo](BareMetal.Geo.md) |
| [BareMetal.Graph](BareMetal.Graph.md) | `<script src="src/BareMetal.Graph.js"></script>` | `create(target, data, options)`, `graphHandle.svg`, `graphHandle.simulation`, `graphHandle.nodes`, `graphHandle.edges`, `graphHandle.addNode(node)`, `graphHandle.addEdge(edge)`, `graphHandle.removeNode(id)`, `graphHandle.removeEdge(source, target)`, `graphHandle.pin(id)`, `graphHandle.unpin(id)`, `graphHandle.stop()`, `graphHandle.restart()`, `graphHandle.destroy()` | [BareMetal.Graph](BareMetal.Graph.md) |
| [BareMetal.I18n](BareMetal.I18n.md) | `<script src="src/BareMetal.I18n.js"></script>` | `setLocale(code)`, `getLocale()`, `configure(opts)`, `addMessages(locale, messages)`, `t(key, params)`, `loadMessages(locale, url)`, `isRTL(locale)`, `subscribe(fn)`, `configure()` | [BareMetal.I18n](BareMetal.I18n.md) |
| [BareMetal.ID3](BareMetal.ID3.md) | `<script src="src/BareMetal.ID3.js"></script>` | `title`, `artist`, `album`, `year`, `comment`, `track`, `genre` | [BareMetal.ID3](BareMetal.ID3.md) |
| [BareMetal.IDB](BareMetal.IDB.md) | `<script src="src/BareMetal.IDB.js"></script>` | `open(name, opts)`, `isSupported()`, `databases()`, `deleteDatabase(name)`, `kv(name)`, `db.close()`, `db.stores()`, `db.put(store, value)`, `db.putAll(store, values)`, `db.get(store, key)`, `db.getAll(store, opts)`, `db.delete(store, key)`, `db.deleteAll(store, keys)`, `db.clear(store)`, `db.count(store)`, `db.getBy(store, index, value)`, `db.getAllBy(store, index, value, opts)`, `db.range(store, index, opts)`, `db.each(store, cb)`, `db.eachBy(store, index, opts, cb)`, `db.filter(store, cb)`, `db.transaction(stores, mode, fn)`, `db.batch(store, op, items)`, `db.export(store)`, `db.import(store, data)`, `kvStore.set(key, value)`, `kvStore.get(key)`, `kvStore.delete(key)`, `kvStore.has(key)`, `kvStore.keys()`, `kvStore.clear()`, `kvStore.close()` | [BareMetal.IDB](BareMetal.IDB.md) |
| [BareMetal.Inbox](modules/BareMetal.Inbox.md) | `<script src="src/BareMetal.Inbox.js"></script>` | `create(options)` | [BareMetal.Inbox](modules/BareMetal.Inbox.md) |
| [BareMetal.InputRouter](modules/BareMetal.InputRouter.md) | `<script src="src/BareMetal.InputRouter.js"></script>` | `create(options)` | [BareMetal.InputRouter](modules/BareMetal.InputRouter.md) |
| [BareMetal.Integrity](BareMetal.Integrity.md) | `<script src="src/BareMetal.Integrity.js"></script>` | `version`, `algorithm`, `revision`, `commit`, `source`, `modules` | [BareMetal.Integrity](BareMetal.Integrity.md) |
| [BareMetal.Launcher](BareMetal.Launcher.md) | `<script src="src/BareMetal.Launcher.js"></script>` | `createStore(initial)`, `createApi(options)`, `renderSessionCards(container, sessions, options)`, `createSocket(url, options)`, `attachTerminal(target, socket, options)`, `createLauncher(container, options)` | [BareMetal.Launcher](BareMetal.Launcher.md) |
| [BareMetal.LocalKVStore](BareMetal.LocalKVStore.md) | `<script src="src/BareMetal.LocalKVStore.js"></script>` | `create(options)`, `store.get(key)`, `store.set(key, value, ttl)`, `store.remove(key)`, `store.has(key)`, `store.clear()`, `store.getMany(keys)`, `store.setMany(entries, ttl)`, `store.removeMany(keys)`, `store.keys()`, `store.values()`, `store.entries()`, `store.count()`, `store.find(predicate)`, `store.ttl(key)`, `store.expire(key, ttl)`, `store.persist(key)`, `store.cleanup()`, `store.size()`, `store.onChange(callback)`, `create()` | [BareMetal.LocalKVStore](BareMetal.LocalKVStore.md) |
| [BareMetal.Logger](BareMetal.Logger.md) | `<script src="src/BareMetal.Logger.js"></script>` | `create(opts)`, `console(record)`, `beacon(url)`, `logger.debug(msg, data)`, `logger.info(msg, data)`, `logger.warn(msg, data)`, `logger.error(msg, data)`, `logger.child(extraContext)`, `logger.setLevel(level)`, `logger.addTransport(fn)`, `create()` | [BareMetal.Logger](BareMetal.Logger.md) |
| [BareMetal.Markdown](BareMetal.Markdown.md) | `<script src="src/BareMetal.Markdown.js"></script>` | `render(input, options)`, `inline(input, options)`, `renderTo(el, input, options)`, `renderSafe(el, input, options)`, `createRenderer(options)`, `toc(input, options)`, `frontMatter(input)`, `escape(value)` | [BareMetal.Markdown](BareMetal.Markdown.md) |
| [BareMetal.Media](BareMetal.Media.md) | `<script src="src/BareMetal.Media.js"></script>` | `camera(opts)`, `microphone(opts)`, `screen(opts)`, `snapshot(videoEl, opts)`, `record(stream, opts)`, `recorder.start()`, `recorder.pause()`, `recorder.stop()`, `recorder.onData(cb)`, `recorder.getBlob()`, `devices()`, `switchCamera(stream, deviceId)`, `pip(videoEl)`, `torch(stream, on)`, `preview(stream, container, opts)`, `preview.destroy()`, `constraints(stream)`, `audioContext(stream)`, `analyser.getFrequency()`, `analyser.getWaveform()` | [BareMetal.Media](BareMetal.Media.md) |
| [BareMetal.MermaidDiagramRenderer](BareMetal.MermaidDiagramRenderer.md) | `<script src="src/BareMetal.MermaidDiagramRenderer.js"></script>` | `<module API>` | [BareMetal.MermaidDiagramRenderer](BareMetal.MermaidDiagramRenderer.md) |
| [BareMetal.Metadata](BareMetal.Metadata.md) | `<script src="src/BareMetal.Metadata.js"></script>` | `register(meta)`, `get(slug)`, `list()`, `remove(slug)`, `scanInline()`, `fetchAndRegister(url)`, `toTemplateFields(metaOrSlug)`, `renderForm(slugOrMeta, rootElement, state, watch)`, `renderTable(slugOrMeta, rootElement, items, callbacks)`, `fromBinary(buffer)` | [BareMetal.Metadata](BareMetal.Metadata.md) |
| [BareMetal.MIDI](BareMetal.MIDI.md) | `<script src="src/BareMetal.MIDI.js"></script>` | `inputs`, `outputs` | [BareMetal.MIDI](BareMetal.MIDI.md) |
| [BareMetal.MIDIProfiles](BareMetal.MIDIProfiles.md) | `<script src="src/BareMetal.MIDIProfiles.js"></script>` | `profile`, `version`, `verified`, `mappings`, `feedback`, `note` | [BareMetal.MIDIProfiles](BareMetal.MIDIProfiles.md) |
| [BareMetal.Minifier](modules/BareMetal.Minifier.md) | `<script src="src/BareMetal.Minifier.js"></script>` | `minifyJS(source, options)`, `minifyCSS(source, options)`, `compressGzip(source, options)`, `decompressGzip(source, options)` | [BareMetal.Minifier](modules/BareMetal.Minifier.md) |
| [BareMetal.Modal](BareMetal.Modal.md) | `<script src="src/BareMetal.Modal.js"></script>` | `<module API>` | [BareMetal.Modal](BareMetal.Modal.md) |
| [BareMetal.ModuleLoader](BareMetal.ModuleLoader.md) | `<script src="src/BareMetal.ModuleLoader.js"></script>` | `<module API>` | [BareMetal.ModuleLoader](BareMetal.ModuleLoader.md) |
| [BareMetal.MP3](BareMetal.MP3.md) | `<script src="src/BareMetal.MP3.js"></script>` | `readTags`, `create`, `stream`, `loadCatalog` | [BareMetal.MP3](BareMetal.MP3.md) |
| [BareMetal.MP3Catalog](BareMetal.MP3Catalog.md) | `<script src="src/BareMetal.MP3Catalog.js"></script>` | `version`, `title`, `revision`, `entries` | [BareMetal.MP3Catalog](BareMetal.MP3Catalog.md) |
| [BareMetal.MusicPlayer](BareMetal.MusicPlayer.md) | `<script src="src/BareMetal.MusicPlayer.js"></script>` | `index`, `currentTime`, `volume`, `pitchBendSemitones`, `highDb`, `streaming` | [BareMetal.MusicPlayer](BareMetal.MusicPlayer.md) |
| [BareMetal.Notify](BareMetal.Notify.md) | `<script src="src/BareMetal.Notify.js"></script>` | `toast(message, options)`, `success(message, options)`, `error(message, options)`, `warning(message, options)`, `info(message, options)`, `banner(message, options)`, `dismiss(id)`, `dismissAll()`, `count()`, `configure(options)`, `requestPermission()`, `permission()`, `native(title, options)`, `send(title, options)`, `progress(message, options)`, `progress().update(value, message)`, `progress().complete(message)`, `progress().error(message)`, `progress().dismiss()`, `isSupported()`, `isSecureContext()` | [BareMetal.Notify](BareMetal.Notify.md) |
| [BareMetal.Observe](BareMetal.Observe.md) | `<script src="src/BareMetal.Observe.js"></script>` | `resize(el, callback, opts)`, `intersection(el, callback, opts)`, `mutation(el, callback, opts)`, `lazyLoad(selector, opts)`, `infinite(sentinel, loadMore, opts)`, `sticky(el, opts)`, `viewport(el)`, `trackSize(el, callback, opts)`, `breakpoint(el, breakpoints, callback)`, `animateOnScroll(els, opts)`, `mediaQuery(query, callback)`, `mutationStream(el, opts)` | [BareMetal.Observe](BareMetal.Observe.md) |
| [BareMetal.OfflineData](BareMetal.OfflineData.md) | `<script src="src/BareMetal.OfflineData.js"></script>` | `create(options)`, `client.mutate(input)`, `client.put(key, value, request)`, `client.remove(key, request)`, `client.get(key)`, `client.pending()`, `client.flush()`, `client.resolve(id, choice)`, `client.on(event, handler)`, `client.mountConflictUI(target)`, `client.startAutoSync()`, `client.destroy()` | [BareMetal.OfflineData](BareMetal.OfflineData.md) |
| [BareMetal.Pay](BareMetal.Pay.md) | `<script src="src/BareMetal.Pay.js"></script>` | `canPay()`, `request(details, methods, opts)`, `card(opts)`, `googlePay(config)`, `applePay(config)`, `formatCurrency(amount, currency, locale)`, `cart(seed)`, `cart.add(item)`, `cart.remove(id)`, `cart.update(id, qty)`, `cart.clear()`, `cart.getTotal(currency)`, `cart.getItems()`, `cart.toDetails(label)`, `shipping(options)`, `shipping.add(id, label, amount, selected)`, `shipping.getSelected()`, `shipping.toArray()`, `validate(cardNumber)`, `abort(response)`, `complete(response, result)`, `retry(response, errors)` | [BareMetal.Pay](BareMetal.Pay.md) |
| [BareMetal.PicoScript](BareMetal.PicoScript.md) | `<script src="src/BareMetal.PicoScript.js"></script>` | `label`, `name`, `value`, `description`, `locale` | [BareMetal.PicoScript](BareMetal.PicoScript.md) |
| [BareMetal.Pipeline](BareMetal.Pipeline.md) | `<script src="src/BareMetal.Pipeline.js"></script>` | `create(...stages)`, `compose(...fns)`, `series(fns, input, ctx)`, `parallel(fns, input, ctx)`, `waterfall(fns)`, `stream(iterable)`, `backpressure(producer, consumer, opts)` | [BareMetal.Pipeline](BareMetal.Pipeline.md) |
| [BareMetal.Pivot](BareMetal.Pivot.md) | `<script src="src/BareMetal.Pivot.js"></script>` | `fields`, `groupBy`, `valueField`, `op`, `sort`, `sortDir`, `filter` | [BareMetal.Pivot](BareMetal.Pivot.md) |
| [BareMetal.Play](BareMetal.Play.md) | `<script src="src/BareMetal.Play.js"></script>` | `PACKS`, `mount(target, options?)`, `memoryClient(seed)`, `freshState()`, `matchConditions(state, conditions)`, `applyEffects(state, effects)`, `entryNode(nodes, choices, state)`, `offeredChoices(node, nodes, choices, state)`, `fillText(text, ctx)`, `sceneText(node, progress, persona)`, `withPersonaFacts(state, personas, storyId)`, `narratorOf(personas, storyId)`, `slipsFor(node, templates, progress, persona)`, `fireTriggers(node, templates, progress, persona)` | [BareMetal.Play](BareMetal.Play.md) |
| [BareMetal.Print](BareMetal.Print.md) | `<script src="src/BareMetal.Print.js"></script>` | `render(document, options)`, `paginate(document, options)`, `print(document, options)`, `preview(document, options)`, `receipt(data, options)`, `invoice(data, options)`, `document(data, options)`, `barcode(value, options)`, `qr(value, options)` | [BareMetal.Print](BareMetal.Print.md) |
| [BareMetal.Progressive](BareMetal.Progressive.md) | `<script src="src/BareMetal.Progressive.js"></script>` | `register(swUrl, opts)`, `unregister()`, `getRegistration()`, `update()`, `onInstallPrompt(callback)`, `isInstalled()`, `isInstallable()`, `precache(urls)`, `clearCache(cacheName)`, `getCacheStatus()`, `isOnline()`, `onConnectivityChange(callback)`, `requestSync(tag)`, `subscribePush(vapidPublicKey)`, `unsubscribePush()`, `getPushSubscription()`, `generateManifest(opts)`, `injectManifest(opts)`, `postMessage(msg)`, `onMessage(callback)`, `register()`, `generateManifest()` | [BareMetal.Progressive](BareMetal.Progressive.md) |
| [BareMetal.PubSub](BareMetal.PubSub.md) | `<script src="src/BareMetal.PubSub.js"></script>` | `create()`, `on(topic, handler, opts)`, `once(topic, handler, opts)`, `emit(topic, data, opts)`, `sticky(topic, data, opts)`, `off(topic, handler)`, `offAll(topic)`, `offNs(ns)`, `clear()`, `use(pattern, fn)`, `handle(topic, handler)`, `request(topic, data)`, `channel(topic, opts)`, `topics()`, `subscribers(topic)`, `has(topic)`, `channel.emit(data, emitOpts)`, `channel.subscribe(fn, subOpts)`, `channel.history()`, `channel.last()`, `channel.destroy()` | [BareMetal.PubSub](BareMetal.PubSub.md) |
| [BareMetal.RBAC](BareMetal.RBAC.md) | `<script src="src/BareMetal.RBAC.js"></script>` | `WARNING`, `configure(options)`, `identity()`, `isAuthenticated()`, `hasRole(role)`, `hasAnyRole(roles)`, `hasAllRoles(roles)`, `inGroup(group)`, `inAnyGroup(groups)`, `inAllGroups(groups)`, `can(permission)`, `canAny(permissions)`, `canAll(permissions)`, `hasScope(scope)`, `hasAnyScope(scopes)`, `check(criteria)`, `checkAny(criteria)`, `guard(criteria)`, `applyDOM(rootElement)`, `setToken(token)`, `clearToken()`, `refresh()`, `onExpiry(callback)`, `tenant()`, `isTenant(value)`, `configure()` | [BareMetal.RBAC](BareMetal.RBAC.md) |
| [BareMetal.Rendering](BareMetal.Rendering.md) | `<script src="src/BareMetal.Rendering.js"></script>` | `createEntity(slug)`, `listEntities()`, `window.minibind` | [BareMetal.Rendering](BareMetal.Rendering.md) |
| [BareMetal.Ribbon](BareMetal.Ribbon.md) | `<script src="src/BareMetal.Ribbon.js"></script>` | `el`, `item`, `setActive`, `setDisabled`, `setColour`, `setFont` | [BareMetal.Ribbon](BareMetal.Ribbon.md) |
| [BareMetal.Routing](BareMetal.Routing.md) | `<script src="src/BareMetal.Routing.js"></script>` | `on(pattern, handler)`, `notFound(handler)`, `start()`, `navigate(path, state, replace)`, `window.BMRouter` | [BareMetal.Routing](BareMetal.Routing.md) |
| [BareMetal.Scan](modules/BareMetal.Scan.md) | `<script src="src/BareMetal.Scan.js"></script>` | `capture(options)`, `stream(options)`, `decode(image, options)`, `decodeQR(image, options)`, `decodeBarcode(image, options)`, `ocr(image, options)`, `map(value, options)`, `validate(result, options)`, `continuous(options)`, `overlay(result, options)`, `history()`, `fromImage(image, options)`, `fromBlob(blob, options)` | [BareMetal.Scan](modules/BareMetal.Scan.md) |
| [BareMetal.SceneInspector](modules/BareMetal.SceneInspector.md) | `<script src="src/BareMetal.SceneInspector.js"></script>` | `create(options)` | [BareMetal.SceneInspector](modules/BareMetal.SceneInspector.md) |
| [BareMetal.Schedule](modules/BareMetal.Schedule.md) | `<script src="src/BareMetal.Schedule.js"></script>` | `cron(expression, callback, options)`, `interval(ms, callback)`, `delay(ms, callback)`, `at(date, callback)`, `every(interval, callback)`, `queue(options)`, `scheduler(options)`, `debounce(fn, wait)`, `throttle(fn, wait)`, `retry(fn, options)` | [BareMetal.Schedule](modules/BareMetal.Schedule.md) |
| [BareMetal.Schema](BareMetal.Schema.md) | `<script src="src/BareMetal.Schema.js"></script>` | `string(opts)`, `number(opts)`, `boolean(opts)`, `array(itemSchema, opts)`, `object(shape, opts)`, `date(opts)`, `oneOf(schemas)`, `nullable(schema)`, `optional(schema)`, `custom(name, validateFn, opts)`, `parse(schema, data)`, `validate(schema, data)`, `transform(schema, data)`, `coerce(schema, data)`, `defaults(schema)`, `extend(baseSchema, overrides)`, `pick(schema, keys)`, `omit(schema, keys)`, `partial(schema)`, `version(schema, v, migrations)`, `versionedSchema.migrate(data, fromV, toV)`, `toJSON(schema)`, `fromJSON(descriptor)`, `toBinary(schema, opts)`, `fromBinary(binarySchema)` | [BareMetal.Schema](BareMetal.Schema.md) |
| [BareMetal.Search](modules/BareMetal.Search.md) | `<script src="src/BareMetal.Search.js"></script>` | `createIndex(options)`, `tokenize(text, options)`, `stem(token, language)`, `highlight(text, terms)`, `pipeline(options)` | [BareMetal.Search](modules/BareMetal.Search.md) |
| [BareMetal.SecureTransport](BareMetal.SecureTransport.md) | `<script src="src/BareMetal.SecureTransport.js"></script>` | `envelope`, `method`, `url`, `headers`, `body`, `credentials`, `ok`, `status`, `statusText`, `arrayBuffer`, `text`, `json`, `rsaKey`, `aesKey` | [BareMetal.SecureTransport](BareMetal.SecureTransport.md) |
| [BareMetal.ServiceWorker](BareMetal.ServiceWorker.md) | `<script src="src/BareMetal.ServiceWorker.js"></script>` | `BM_PRECACHE`, `BM_CLEAR_CACHE`, `BM_CACHE_STATUS`, `BM_SET_ROUTES`, `BM_SKIP_WAITING`, `BM_SET_OFFLINE_PAGE`, `cacheFirst(request, cacheName)`, `networkFirst(request, cacheName)`, `staleWhileRevalidate(request, cacheName)`, `networkOnly(request)`, `cacheOnly(request, cacheName)` | [BareMetal.ServiceWorker](BareMetal.ServiceWorker.md) |
| [BareMetal.Session](BareMetal.Session.md) | `<script src="src/BareMetal.Session.js"></script>` | `create(opts)`, `tabSync(key)`, `guard(checkFn, redirectFn)`, `fingerprint()`, `activity(opts)` | [BareMetal.Session](BareMetal.Session.md) |
| [BareMetal.Sheet](BareMetal.Sheet.md) | `<script src="src/BareMetal.Sheet.js"></script>` | `c`, `c0`, `r0`, `c1`, `r1` | [BareMetal.Sheet](BareMetal.Sheet.md) |
| [BareMetal.Speech](BareMetal.Speech.md) | `<script src="src/BareMetal.Speech.js"></script>` | `speak(text, opts)`, `pause()`, `voices(lang)`, `isSpeaking()`, `listen(opts)`, `command(phrases, callback, opts)`, `dictate(opts)`, `queue(items)` | [BareMetal.Speech](BareMetal.Speech.md) |
| [BareMetal.StateMachine](BareMetal.StateMachine.md) | `<script src="src/BareMetal.StateMachine.js"></script>` | `create(config)`, `machine.send(event)`, `machine.getState()`, `machine.getContext()`, `machine.matches(stateName)`, `machine.subscribe(fn)` | [BareMetal.StateMachine](BareMetal.StateMachine.md) |
| [BareMetal.Story](BareMetal.Story.md) | `<script src="src/BareMetal.Story.js"></script>` | `PACKS`, `mount(target, options?)`, `memoryClient(seed)`, `validateConditions(value)`, `validateEffects(value)`, `validateTriggers(value)`, `validateBaseFacts(value)`, `graphData(nodes, choices)` | [BareMetal.Story](BareMetal.Story.md) |
| [BareMetal.Sync](BareMetal.Sync.md) | `<script src="src/BareMetal.Sync.js"></script>` | `diff(a, b)`, `patch(target, ops)`, `merge(local, remote, base, strategy)`, `conflict(path, local, remote, base)`, `resolve(conflicts, resolutions)`, `queue(opts)`, `replay(ops, applyFn)`, `echo(sent, received)`, `clock(initial)`, `crdt(type, opts)`, `version(obj)`, `subscribe(syncable, callback)`, `batch(ops)` | [BareMetal.Sync](BareMetal.Sync.md) |
| [BareMetal.Tabs](modules/BareMetal.Tabs.md) | `<script src="src/BareMetal.Tabs.js"></script>` | `create(options)` | [BareMetal.Tabs](modules/BareMetal.Tabs.md) |
| [BareMetal.Template](BareMetal.Template.md) | `<script src="src/BareMetal.Template.js"></script>` | `buildForm(layout, fields)`, `buildTable(fields, items, callbacks)`, `buildInput(name, field)`, `buildLabel(name, field)` | [BareMetal.Template](BareMetal.Template.md) |
| [BareMetal.Tenant](modules/BareMetal.Tenant.md) | `<script src="src/BareMetal.Tenant.js"></script>` | `create(options)`, `resolve(id)`, `switch(id)`, `isolate(id, fn)`, `partition(id)`, `hierarchy(id)`, `limits(id)`, `features(id)`, `suspend(id)`, `activate(id)` | [BareMetal.Tenant](modules/BareMetal.Tenant.md) |
| [BareMetal.TestRunner](BareMetal.TestRunner.md) | `<script src="src/BareMetal.TestRunner.js"></script>` | `describe(name, fn)`, `it(name, fn, timeout)`, `test(name, fn, timeout)`, `expect(value)`, `beforeEach(fn)`, `afterEach(fn)`, `beforeAll(fn)`, `afterAll(fn)`, `mock.fn(impl)`, `mock.fetch(responses)`, `run(opts)`, `configure(opts)`, `toTAP(res)`, `toMarkdown(res, opts)`, `installGlobals()`, `run()` | [BareMetal.TestRunner](BareMetal.TestRunner.md) |
| [BareMetal.ThemePicker](modules/BareMetal.ThemePicker.md) | `<script src="src/BareMetal.ThemePicker.js"></script>` | `create(options)` | [BareMetal.ThemePicker](modules/BareMetal.ThemePicker.md) |
| [BareMetal.Time](BareMetal.Time.md) | `<script src="src/BareMetal.Time.js"></script>` | `now()`, `utcNow()`, `parse(input)`, `create(year, month, day, hour, minute, second, ms)`, `fromDate(date)`, `format(dt, pattern)`, `formatRelative(dt, base)`, `toISO(dt)`, `toDate(dt)`, `add(dt, amount, unit)`, `subtract(dt, amount, unit)`, `startOf(dt, unit)`, `endOf(dt, unit)`, `isBefore(a, b)`, `isAfter(a, b)`, `isSame(a, b, precision)`, `isBetween(dt, start, end)`, `diff(a, b, unit)`, `duration(ms)`, `formatDuration(ms, opts)`, `daysInMonth(year, month)`, `isLeapYear(year)`, `dayOfWeek(dt)`, `dayOfWeekName(dt)`, `weekNumber(dt)`, `toTimezone(dt, tz)`, `getTimezone()`, `hasTemporal()`, `toTemporal(dt)`, `fromTemporal(t)` | [BareMetal.Time](BareMetal.Time.md) |
| [BareMetal.Timeline](modules/BareMetal.Timeline.md) | `<script src="src/BareMetal.Timeline.js"></script>` | `create(options)`, `formatTime(seconds)` | [BareMetal.Timeline](modules/BareMetal.Timeline.md) |
| [BareMetal.Tokens](BareMetal.Tokens.md) | `<script src="src/BareMetal.Tokens.js"></script>` | `sign(payload, key, options)`, `signSync(payload, key, options)`, `decode(token)`, `verify(token, key, options)`, `isExpired(token, options)`, `expiresIn(token, options)`, `claim(token, name)`, `generateSecret(algorithmName)`, `generateKeyPair(algorithmName)`, `importKey(keyData, algorithmName, kind)`, `exportKey(key)`, `importJWK(jwk, algorithmName, kind)`, `create(payload)`, `parseDuration(value)`, `toBase64Url(value)`, `fromBase64Url(value)` | [BareMetal.Tokens](BareMetal.Tokens.md) |
| [BareMetal.Transport](BareMetal.Transport.md) | `<script src="src/BareMetal.Transport.js"></script>` | `retry(fn, policy)`, `backoff(attempt, policy)`, `idempotencyKey()`, `dedupe(keyFn, fn)`, `deduped.inflight()`, `coalesce(requests, opts)`, `coalescer.flush()`, `cancel(parentSignal)`, `scope.abort(reason)`, `timeout(ms)`, `timeout.clear()`, `race(promises, signal)`, `cache(fn, opts)`, `cached.clear()`, `priority(fn, level)`, `queue(opts)`, `queueApi.add(fn, level)`, `queueApi.pause()`, `queueApi.size()`, `circuit(fn, opts)`, `circuit.state()`, `rateLimit(fn, opts)`, `limited.pending()` | [BareMetal.Transport](BareMetal.Transport.md) |
| [BareMetal.Types](BareMetal.Types.md) | `<script src="src/BareMetal.Types.js"></script>` | `define(name, descriptor)`, `check(value, type)`, `is(value, type)`, `assert(value, type)`, `cast(value, type)`, `of(value)`, `registry`, `contract(input, output)`, `guard(type)`, `union(...types)`, `intersection(...types)`, `literal(value)`, `tuple(...types)`, `record(keyType, valueType)`, `nullable(type)`, `optional(type)`, `reflect(typeName)`, `serialize(value, type)`, `deserialize(data, type)`, `equals(a, b, type)`, `clone(value, type)` | [BareMetal.Types](BareMetal.Types.md) |
| [BareMetal.UndoRedo](BareMetal.UndoRedo.md) | `<script src="src/BareMetal.UndoRedo.js"></script>` | `create(options)`, `createSnap(options)`, `history.push(cmd)`, `history.exec(cmd)`, `history.undo()`, `history.redo()`, `history.canUndo()`, `history.canRedo()`, `history.undoName()`, `history.redoName()`, `history.size()`, `history.index()`, `history.beginGroup(name, data)`, `history.endGroup()`, `history.group(name, fn, data)`, `history.toJSON()`, `history.fromJSON(json)`, `history.clear()`, `history.clearRedo()`, `history.checkpoint()`, `history.revertTo(point)`, `history.bindKeys(el)`, `history.on(name, fn)`, `history.off(name, fn)`, `snapshotHistory.snapshot(value)`, `snapshotHistory.undo()`, `snapshotHistory.redo()`, `snapshotHistory.current()` | [BareMetal.UndoRedo](BareMetal.UndoRedo.md) |
| [BareMetal.URL](BareMetal.URL.md) | `<script src="src/BareMetal.URL.js"></script>` | `parse(url)`, `build(parts)`, `query.encode(obj)`, `query.decode(queryString)`, `query.merge(url, paramsObject)`, `query.remove(url, keys)`, `params(pattern, url)`, `template(pattern, data)`, `join(...parts)`, `normalize(url)`, `isAbsolute(url)`, `isRelative(url)`, `resolve(base, relative)`, `compare(a, b)`, `slug(text)`, `encode(value)`, `decode(value)`, `hash.get(url)`, `hash.set(url, value)`, `origin(url)`, `isValid(url)`, `relative(from, to)` | [BareMetal.URL](BareMetal.URL.md) |
| [BareMetal.Validate](BareMetal.Validate.md) | `<script src="src/BareMetal.Validate.js"></script>` | `validate(schema, data)`, `addRule(name, fn)` | [BareMetal.Validate](BareMetal.Validate.md) |
| [BareMetal.Vector](modules/BareMetal.Vector.md) | `<script src="src/BareMetal.Vector.js"></script>` | `createDatabase(options)`, `cosineSimilarity(a, b)` | [BareMetal.Vector](modules/BareMetal.Vector.md) |
| [BareMetal.VectorSearch](modules/BareMetal.VectorSearch.md) | `<script src="src/BareMetal.VectorSearch.js"></script>` | `createIndex(options)`, `cosineSimilarity(a, b)` | [BareMetal.VectorSearch](modules/BareMetal.VectorSearch.md) |
| [BareMetal.VTTerminal](BareMetal.VTTerminal.md) | `<script src="src/BareMetal.VTTerminal.js"></script>` | `fg`, `bg`, `bold`, `dim`, `inverse`, `underline` | [BareMetal.VTTerminal](BareMetal.VTTerminal.md) |
| [BareMetal.Workers](BareMetal.Workers.md) | `<script src="src/BareMetal.Workers.js"></script>` | `create(workerFn)`, `spawn(workerFn)`, `shared(workerFn, opts)`, `pool(workerFn, opts)`, `debounce(fn, wait, opts)`, `throttle(fn, wait, opts)`, `read(fn)`, `write(fn)`, `nextFrame(fn)`, `cancelFrame(id)`, `idle(fn, opts)`, `cancelIdle(id)`, `idleQueue(tasks, opts)`, `taskQueue(opts)`, `delay(ms)`, `interval(fn, ms)`, `timeout(valueOrPromise, ms)`, `retry(fn, opts)`, `cleanup()`, `runner.run(payload, transfer)`, `runner.terminate()`, `workerHandle.send(data, transfer)`, `workerHandle.on(event, handler)`, `workerHandle.terminate()`, `sharedHandle.send(data, transfer)`, `sharedHandle.on(event, handler)`, `sharedHandle.close()`, `pool.run(data, transfer)`, `pool.runAll(items)`, `pool.map(items, fn)`, `pool.terminate()`, `pool.stats()`, `queue.add(fn, opts)`, `queue.pause()`, `queue.resume()`, `queue.clear()`, `queue.stats()`, `idleQueue.cancel()`, `interval.stop()`, `interval.restart()` | [BareMetal.Workers](BareMetal.Workers.md) |
| [BareMetal.Workflow](BareMetal.Workflow.md) | `<script src="src/BareMetal.Workflow.js"></script>` | `create(name, steps)`, `run(name, initialContext)`, `exec(steps, initialContext)`, `list()`, `get(name)`, `remove(name)`, `onStep(fn)`, `onError(fn)`, `onComplete(fn)`, `toJSON(name)`, `fromJSON(name, json)`, `stepTypes()`, `designer(container, workflowName)` | [BareMetal.Workflow](BareMetal.Workflow.md) |

## BareMetal.3DXR

```html
<script src="src/BareMetal.3DXR.js"></script>
```

```js
<canvas id="scene" class="scene"></canvas>
<button id="enter-vr">Enter VR</button>
<script src="BareMetal.3DXR.js"></script>
<script>
  const xr = BareMetal['3DXR'].create(document.querySelector('#scene'));
  xr.setProceduralBackground('spiral', { colors: ['#160924', '#ff2b9d'], speed: 0.8 });
  const clips = ['/media/a.mp4', '/media/b.mp4', '/media/c.mp4'];

  xr.addVideo({
    id: 'tile-1', src: clips[0], playlist: clips, shuffle: true,
    position: [-1, 1.6, -3], width: 1.6, height: 0.9, yaw: -0.25
  });
  xr.addVideo({
    id: 'tile-2', src: clips[1], playlist: clips, shuffle: true,
    position: [1, 1.6, -3], width: 1.6, height: 0.9, yaw: 0.25
  });

  xr.on('focuschange', ({ id }) => console.log('Audio focus:', id));
  xr.on('tileended', ({ id }) => console.log('Tile advanced:', id));
  xr.setAmbientTrack('/media/ambient.mp3', { volume: 0.2 });
  document.querySelector('#enter-vr').addEventListener('click', () => xr.enterVR());
</script>
```

### Public API

`BareMetal['3DXR'].create(canvas, options)`, `renderer.addVideo(options)`

Implementation guide: [BareMetal.3DXR.md](BareMetal.3DXR.md)

## BareMetal.A11y

```html
<script src="src/BareMetal.A11y.js"></script>
```

```js
const trap = BareMetal.A11y.focusTrap(modal, { initialFocus: '[data-autofocus]' });
closeButton.addEventListener('click', () => trap.destroy());
```

### Public API

`focusTrap(container, opts)`, `announce(text, priority)`, `skipNav(targetId)`, `roving(container, selector, opts)`, `prefersReducedMotion()`, `prefersColorScheme()`, `onMotionChange(fn)`, `onSchemeChange(fn)`, `focusTrap()`, `roving()`

Implementation guide: [BareMetal.A11y.md](BareMetal.A11y.md)

## BareMetal.AI

```html
<script src="src/BareMetal.AI.js"></script>
```

```js
const ai = BareMetal.AI.create({
  endpoint: '/api/ai/stream',
  model: 'assistant-model'
});

const result = await ai.stream(
  [{ role: 'user', content: 'Summarize the current order status.' }],
  { onDelta: text => output.append(document.createTextNode(text)) }
);
console.log(result.finishReason, result.usage);
```

### Public API

`create(options)`, `client.stream(messages, options)`, `client.run(messages, options)`

Implementation guide: [BareMetal.AI.md](BareMetal.AI.md)

## BareMetal.Animate

```html
<script src="src/BareMetal.Animate.js"></script>
```

```js
BareMetal.Animate.enter(panel, 'fade-in', () => {
  console.log('panel is visible');
});
```

### Public API

`enter(el, className, done)`, `leave(el, className, done)`, `toggle(el, enterClass, leaveClass)`, `move(el, fromRect, toRect)`, `list(container, className)`, `prefersReducedMotion()`

Implementation guide: [BareMetal.Animate.md](BareMetal.Animate.md)

## BareMetal.AudioMixer

```html
<script src="src/BareMetal.AudioMixer.js"></script>
```

```js
const mixer = BareMetal.AudioMixer.create({ tracks: [] });
mixer.addTrack({ id:'deck-a', label:'Deck A', gain:1 });
```

### Public API

`create(options)`

Implementation guide: [modules/BareMetal.AudioMixer.md](modules/BareMetal.AudioMixer.md)

## BareMetal.Auth

```html
<script src="src/BareMetal.Auth.js"></script>
```

```js
await BareMetal.Auth.login({ prompt: 'login', login_hint: 'ada@example.com' });
```

### Public API

`configure(options)`, `initialize()`, `login(extraParams)`, `handleCallback(url)`, `logout()`, `clearSession()`, `getToken()`, `getIdToken()`, `silentRefresh()`, `handleSilentCallback()`, `getUser()`, `getUserInfo()`, `isAuthenticated()`, `onAuthChange(callback)`, `attachToRest()`, `_setRedirect(fn)`, `renderLogin(container, options)`, `renderLogout(container, options)`, `renderWhoami(container, options)`, `renderTokenInspector(container, options)`, `renderUserTiles(container, options)`, `renderAuthGate(container, options)`, `configure()`, `login()`, `renderLogin()`, `renderLogout()`, `renderWhoami()`, `renderTokenInspector()`, `renderUserTiles()`, `renderAuthGate()`

Implementation guide: [BareMetal.Auth.md](BareMetal.Auth.md)

## BareMetal.Authenticator

```html
<script src="src/BareMetal.Authenticator.js"></script>
```

```js
const moduleApi = BareMetal.Authenticator;
// Source: ./src/BareMetal.Authenticator.js
// See the public API list below for call signatures.
```

### Public API

`setup(userId, options)`, `verify(code, secret, options)`, `generate(secret, options)`, `challenge(session, options)`, `protect(fn, options)`, `replayGuard(secret, options)`, `backupVerify(code, backupCodes)`, `qrSvg(uri, options)`

Implementation guide: [modules/BareMetal.Authenticator.md](modules/BareMetal.Authenticator.md)

## BareMetal.Binary

```html
<script src="src/BareMetal.Binary.js"></script>
```

```js
await BareMetal.Binary.setSigningKeyBytes(new Uint8Array(32).fill(1));
```

### Public API

`setSigningKey(base64Key)`, `setSigningKeyBytes(keyBytes)`, `fetchSchema(slug, apiRoot)`, `getCachedSchema(slug)`, `serialize(object, schema)`, `deserialize(buffer, schema)`, `deserializeList(buffer, schema)`, `verifySignature(payload)`, `fetchLayout(slug)`, `createTracker(entity, layout)`, `buildDelta(tracker, layout)`, `applyDelta(slug, entityId, deltaBuffer)`, `applyDeltaJson(slug, entityId, changes, expectedVersion = 0)`, `SpanReader`, `new BareMetal.Binary.SpanReader(buffer)`, `SpanWriter`, `new BareMetal.Binary.SpanWriter(size = 256)`

Implementation guide: [BareMetal.Binary.md](BareMetal.Binary.md)

## BareMetal.Bind

```html
<script src="src/BareMetal.Bind.js"></script>
```

```js
const { state, watch, data } = BareMetal.Bind.reactive({ items: [], open: false });
watch('items', () => console.log('items changed', data.items.length));
state.items.push({ id: 1, name: 'Desk' });
state.open = true;
```

### Public API

`reactive(initial)`, `bind(root, state, watch)`, `formatters`, `getPath(obj, path)`, `setPath(obj, path, value)`, `topKey(path)`, `parseBinding(expr)`, `applyPipes(value, pipes)`, `resolveInScope(path, state, scope)`, `resolveBinding(expr, state, scope)`, `parsePairs(attr)`, `applyRow(el, state, scope)`, `el(tag, className)`, `m-each`

Implementation guide: [BareMetal.Bind.md](BareMetal.Bind.md)

## BareMetal.Blob

```html
<script src="src/BareMetal.Blob.js"></script>
```

```js
const moduleApi = BareMetal.Blob;
// Source: ./src/BareMetal.Blob.js
// See the public API list below for call signatures.
```

### Public API

`usage(options)`, `create(options)`, `chunk(blob, options)`, `upload(blob, options)`, `resume(token, options)`, `download(id, options)`, `hash(blob, options)`, `store(adapter)`, `lifecycle(options)`, `transform(blob, options)`, `encrypt(blob, key)`, `decrypt(blob, key)`

Implementation guide: [modules/BareMetal.Blob.md](modules/BareMetal.Blob.md)

## BareMetal.Cache

```html
<script src="src/BareMetal.Cache.js"></script>
```

```js
const cache = BareMetal.Cache.create({
  ttl: 30_000,
  swr: 5_000,
  maxSize: 250,
  storage: 'localStorage'
});
```

### Public API

`create(opts)`, `tiered(levels)`, `lru(maxSize)`, `memoize(fn, opts)`

Implementation guide: [BareMetal.Cache.md](BareMetal.Cache.md)

## BareMetal.Capabilities

```html
<script src="src/BareMetal.Capabilities.js"></script>
```

```js
BareMetal.Capabilities.detect('serviceWorker');
```

### Public API

`detect(feature)`, `detectAll(features)`, `profile()`, `supports(feature, fallbackValue)`, `fallback(...options)`, `permission(name)`, `requestPermission(name)`, `register(name, detectFn)`, `require(features)`, `degrade(features, levels)`, `onChange(callback)`, `constraints()`, `score()`, `compare(required, available)`

Implementation guide: [BareMetal.Capabilities.md](BareMetal.Capabilities.md)

## BareMetal.Charts

```html
<script src="src/BareMetal.Charts.js"></script>
```

```js
BareMetal.Charts.bar('#revenue', [
  { label: 'Q1', value: 120000 },
  { label: 'Q2', value: 156000 },
  { label: 'Q3', value: 149000 }
], { showValues: true, colors: ['--bs-primary'] });
```

### Public API

`bar(target, data, options)`, `line(target, data, options)`, `sparkline(target, values, options)`, `donut(target, data, options)`, `gauge(target, value, options)`

Implementation guide: [BareMetal.Charts.md](BareMetal.Charts.md)

## BareMetal.Clipboard

```html
<script src="src/BareMetal.Clipboard.js"></script>
```

```js
await BareMetal.Clipboard.writeText('Invoice #1042');
```

### Public API

`writeText(text)`, `readText()`, `write(list)`, `read()`, `copy(text, options)`, `copyFrom(element, options)`, `copyImage(node)`, `readImage()`, `onPaste(element, callback)`, `onPasteFiles(element, callback)`, `onPasteImage(element, callback)`, `cut(element)`, `checkPermission(name)`, `requestPermission(name)`, `isSupported()`, `isSecureContext()`

Implementation guide: [BareMetal.Clipboard.md](BareMetal.Clipboard.md)

## BareMetal.Codes

```html
<script src="src/BareMetal.Codes.js"></script>
```

```js
const gb = BareMetal.Codes.countries.get('GB');
const matches = BareMetal.Codes.countries.search('united');
```

### Public API

`countries`, `currencies`, `days`, `months`, `languages`, `timezones`, `http`, `mime`, `colours`, `cards`, `units`, `subdivisions(code)`

Implementation guide: [BareMetal.Codes.md](BareMetal.Codes.md)

## BareMetal.Colour

```html
<script src="src/BareMetal.Colour.js"></script>
```

```js
const picker = BareMetal.Colour.create('#slot', {
  value: '#e91e8c',
  onChange(hex) { console.log(hex); }
});
picker.get(); // '#e91e8c'
```

### Public API

`el`, `get`, `set`, `open`, `close`

Implementation guide: [BareMetal.Colour.md](BareMetal.Colour.md)

## BareMetal.Communications

```html
<script src="src/BareMetal.Communications.js"></script>
```

```js
BareMetal.Communications.setRoot('/v2/api');
console.log(BareMetal.Communications.getRoot()); // /v2/api/
```

### Public API

`setRoot(root)`, `getRoot()`, `init()`, `call(method, url, body)`, `entity(slug)`, `entityClient.list(query)`, `entityClient.get(id)`, `entityClient.create(data)`, `entityClient.update(id, data)`, `entityClient.remove(id)`, `entityClient.delta(id, changes, expectedVersion = 0)`, `entityClient.deltaFromTracker(tracker)`, `entityClient.metadata()`, `byId(routeId, options)`, `resolveRouteId(verb, path)`, `connectWs(url)`, `isWsReady()`, `ensureBinary()`, `isBinaryAvailable()`, `walStream(entityName)`, `walStreamAll()`, `setCompression(options)`, `getCompression()`

Implementation guide: [BareMetal.Communications.md](BareMetal.Communications.md)

## BareMetal.ComponentFactories

```html
<script src="src/BareMetal.ComponentFactories.js"></script>
```

```js
BareMetal.ComponentFactories.create.message('Can you resend the quote?', { avatar: '🧑' });
```

### Public API

`create.message(text, opts)`, `create.botMessage(text, opts)`, `create.toast(message, opts)`, `create.calendarEvent(date, label, opts)`, `create.ganttTask(label, start, end, opts)`, `create.treeNode(label, opts)`, `create.tableRow(obj)`, `create.navLink(text, href, opts)`, `create.navDropdown(title, ...links)`, `create.listItem(key, data)`, `chatEndpoint(messagesKey, url, opts)`, `chatEndpoint()`

Implementation guide: [BareMetal.ComponentFactories.md](BareMetal.ComponentFactories.md)

## BareMetal.Components

```html
<script src="src/BareMetal.Components.js"></script>
```

```js
const { state, watch } = BareMetal.Bind.reactive({
  links: [
    { text: 'Dashboard', href: '/', active: true },
    ['Admin', { text: 'Users', href: '/users' }, { text: 'Roles', href: '/roles' }]
  ]
});
BareMetal.Components.bindComponents(document.getElementById('nav'), state, watch);
```

### Public API

`bindComponents(root, state, watch)`, `m-img`, `m-chatbot`, `m-calendar`, `m-gantt`, `m-table`, `m-tree`, `m-entity`

Implementation guide: [BareMetal.Components.md](BareMetal.Components.md)

## BareMetal.Compress

```html
<script src="src/BareMetal.Compress.js"></script>
```

```js
const bytes = new TextEncoder().encode(JSON.stringify(payload));
const compressed = BareMetal.Compress.compress(bytes, { profile: 'q3' });
```

### Public API

`compress(input, options)`, `decompress(input)`, `compressBound(inputLength)`, `PROFILES`, `compress()`

Implementation guide: [BareMetal.Compress.md](BareMetal.Compress.md)

## BareMetal.Config

```html
<script src="src/BareMetal.Config.js"></script>
```

```js
const config = BareMetal.Config.create({
  strict: true,
  schema: {
    apiBase: { type: 'string', required: true },
    featureFlag: { type: 'boolean', default: false }
  }
});
```

### Public API

`create(opts)`, `priorities`

Implementation guide: [BareMetal.Config.md](BareMetal.Config.md)

## BareMetal.ControlSurface

```html
<script src="src/BareMetal.ControlSurface.js"></script>
```

```js
const panel = BareMetal.ControlSurface.create({ title:'Settings', fields:[{ name:'level', type:'range', min:0, max:1, defaultValue:0.7 }] });
document.querySelector('#app').append(panel.element);
```

### Public API

`create(options)`

Implementation guide: [modules/BareMetal.ControlSurface.md](modules/BareMetal.ControlSurface.md)

## BareMetal.Controls

```html
<script src="src/BareMetal.Controls.js"></script>
```

```js
const moduleApi = BareMetal.Controls;
// Source: ./src/BareMetal.Controls.js
// See the public API list below for call signatures.
```

### Public API

``

Implementation guide: [BareMetal.Controls.md](BareMetal.Controls.md)

## BareMetal.Crypto

```html
<script src="src/BareMetal.Crypto.js"></script>
```

```js
const exported = localStorage.getItem('prefs-key');
const key = exported
  ? await BareMetal.Crypto.importKey(JSON.parse(exported), 'AES-GCM', ['encrypt', 'decrypt'])
  : await BareMetal.Crypto.generateSymmetricKey(true);

if (!exported) {
  const jwk = await BareMetal.Crypto.exportKey(key);
  localStorage.setItem('prefs-key', JSON.stringify(jwk));
}

const encrypted = await BareMetal.Crypto.encryptSymmetric(key, JSON.stringify({ theme: 'dark' }));
```

### Public API

`generateSymmetricKey(extractable)`, `encryptSymmetric(key, data)`, `decryptSymmetric(key, iv, ciphertext)`, `generateAsymmetricKey(bits, extractable)`, `encryptAsymmetric(publicKey, data)`, `decryptAsymmetric(privateKey, envelope)`, `digest(data)`, `digestWithSalt(data, salt)`, `deriveKey(password, salt, iterations)`, `generateSigningKey(extractable)`, `sign(privateKey, data)`, `verifySignature(publicKey, data, signature)`, `exportKey(key, format = 'jwk')`, `importKey(keyData, algorithm, usages, format = 'jwk', extractable)`, `toBase64Url(buffer)`, `fromBase64Url(string)`, `toUtf8(string)`, `fromUtf8(buffer)`, `randomBytes(length)`

Implementation guide: [BareMetal.Crypto.md](BareMetal.Crypto.md)

## BareMetal.DataGrid

```html
<script src="src/BareMetal.DataGrid.js"></script>
```

```js
const grid = BareMetal.DataGrid.create('#orders', {
  rows: initialOrders,
  columns: [
    { key: 'id', label: 'Order', sort: true },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status', editable: true },
    { key: 'total', label: 'Total', type: 'number', editable: true }
  ],
  pageSize: 200,
  rowHeight: 38,
  viewportHeight: 480,
  onBulkEdit: async ({ ids, patch }) => saveMany(ids, patch)
});
```

### Public API

`create(target, options)`, `grid.loadPage(page)`, `grid.setRows(rows)`, `grid.setPageSize(size)`, `grid.setSort(key, direction)`, `grid.setFilters(filters)`, `grid.getState()`, `grid.selected()`, `grid.clearSelection()`, `grid.bulkEdit(patch)`, `grid.destroy()`

Implementation guide: [BareMetal.DataGrid.md](BareMetal.DataGrid.md)

## BareMetal.Diagnostics

```html
<script src="src/BareMetal.Diagnostics.js"></script>
```

```js
const save = BareMetal.Diagnostics.trace('order.save', async order => api.save(order));
```

### Public API

`trace(name, fn)`, `span(name, opts)`, `timeline()`, `inspect(value, opts)`, `why(value, history)`, `watch(target, path, callback)`, `perf`, `counter(name)`, `gauge(name, fn)`, `report()`, `enable()`, `disable()`, `hook(moduleName, instance)`

Implementation guide: [BareMetal.Diagnostics.md](BareMetal.Diagnostics.md)

## BareMetal.DJDeck

```html
<script src="src/BareMetal.DJDeck.js"></script>
```

```js
const deck = BareMetal.DJDeck.create();
await deck.loadFile(fileFromPicker);
deck.play();
deck.setCuePoint(8);
deck.setHotCue(0, 8);
deck.jumpHotCue(0);
deck.setPitch(-1);
deck.setTempo(103);
deck.setLoop(8, true);
```

### Public API

`bpm`, `track`, `playing`, `elapsed`, `remaining`, `duration`, `beatGrid`, `waveform`, `hotCues`, `cuePoint`, `loop`, `pitchSemitones`, `tempoPercent`, `playbackRate`

Implementation guide: [BareMetal.DJDeck.md](BareMetal.DJDeck.md)

## BareMetal.DJLibrary

```html
<script src="src/BareMetal.DJLibrary.js"></script>
```

```js
const library = BareMetal.DJLibrary.create();
await library.saveTrack({ id: file.name, title: 'Track', bpm: 128, key: 'Am' });
await library.saveCues(file.name, { hotCues: [0, 32], loops: [], cuePoint: 0 });
const tracks = await library.search('', { minBpm: 120, maxBpm: 140 });
```

### Public API

`saveTrack`, `getTrack`, `listTracks`, `deleteTrack`, `search`, `saveCues`, `getCues`, `savePlaylist`, `getPlaylist`, `saveSetting`, `getSetting`

Implementation guide: [BareMetal.DJLibrary.md](BareMetal.DJLibrary.md)

## BareMetal.DJMixer

```html
<script src="src/BareMetal.DJMixer.js"></script>
```

```js
const mixer = BareMetal.DJMixer.create({ masterGain: 1 });
const ch0 = mixer.addChannel(0, audioElement0);
const ch1 = mixer.addChannel(1, audioElement1);
const ch2 = mixer.addChannel(2, audioElement2);
const ch3 = mixer.addChannel(3, audioElement3);

mixer.setChannel(0, { low: 3, mid: -1, high: 2, pan: -0.2, gainDb: -3 });
mixer.setCrossfader(-0.5);
mixer.setPitch(0, 2);
mixer.setPitchBend(0, -0.25);
```

### Public API

`enabled`, `mix`, `gain`, `channels`

Implementation guide: [BareMetal.DJMixer.md](BareMetal.DJMixer.md)

## BareMetal.DocChain

```html
<script src="src/BareMetal.DocChain.js"></script>
```

```js
const moduleApi = BareMetal.DocChain;
// Source: ./src/BareMetal.DocChain.js
// See the public API list below for call signatures.
```

### Public API

`defineType(name, schema)`, `create(type, data, options)`, `derive(parent, type, data)`, `transition(document, status)`, `validate(document)`, `lineage(id)`, `auditTrail(id)`, `store`

Implementation guide: [modules/BareMetal.DocChain.md](modules/BareMetal.DocChain.md)

## BareMetal.Document

```html
<script src="src/BareMetal.Document.js"></script>
```

```js
<script src="BareMetal.Document.js"></script>
<div id="doc" style="height:24rem"></div>
<script>
  const doc = BareMetal.Document.create('#doc', {
    html: '<h1>Notes</h1><p>Semantic HTML.</p>',
    onChange(html, prev) { console.log(html); }
  });
  doc.bold();
</script>
```

### Public API

`el`, `page`, `getHTML`, `setHTML`, `command`, `bold`, `italic`, `underline`, `heading`, `paragraph`, `list`, `color`, `hilite`, `font`, `fontSize`, `query`

Implementation guide: [BareMetal.Document.md](BareMetal.Document.md)

## BareMetal.DocumentRenderer

```html
<script src="src/BareMetal.DocumentRenderer.js"></script>
```

```js
const result = await BareMetal.DocumentRenderer.render(invoiceHtml, {
  title: 'Invoice INV-1042',
  pageSize: 'A4',
  orientation: 'portrait',
  margin: 14,
  scale: 1.5
});

const url = URL.createObjectURL(result.blob);
downloadLink.href = url;
downloadLink.download = 'invoice-1042.pdf';
```

### Public API

`isSupported()`, `sanitizeHTML(html)`, `pageBreak()`, `render(html, options)`, `download(html, filename, options)`

Implementation guide: [BareMetal.DocumentRenderer.md](BareMetal.DocumentRenderer.md)

## BareMetal.DocumentWAL

```html
<script src="src/BareMetal.DocumentWAL.js"></script>
```

```js
<script src="BareMetal.DocumentWAL.js"></script>
<script>
  const wal = BareMetal.DocumentWAL.create({
    docId: 'sheet-1',
    snapshot: { cells: {} },
    transport: BareMetal.DocumentWAL.memoryTransport()
  });
  wal.set('cells.A1', { v: 'Hello' });
  wal.undo();
  wal.push().then(() => wal.pull());
  const stream = wal.stream(0);
</script>
```

### Public API

`create(options)`, `memoryTransport(seed?)`, `httpTransport(root)`

Implementation guide: [BareMetal.DocumentWAL.md](BareMetal.DocumentWAL.md)

## BareMetal.DragDrop

```html
<script src="src/BareMetal.DragDrop.js"></script>
```

```js
{ type: el.dataset.type || '', id: el.id || '', text: el.textContent.trim() }
```

### Public API

`draggable(el, opts)`, `droppable(el, opts)`, `sortable(container, opts)`

Implementation guide: [BareMetal.DragDrop.md](BareMetal.DragDrop.md)

## BareMetal.Errors

```html
<script src="src/BareMetal.Errors.js"></script>
```

```js
const err = new BareMetal.Errors.BareMetalError('AUTH_ERROR', 'Token expired', {
  category: 'auth',
  retryable: false
});
```

### Public API

`new BareMetalError(code, message, opts)`, `create(code, message, opts)`, `classify(err)`, `isRetryable(err)`, `isTransient(err)`, `chain(err, cause)`, `getChain(err)`, `toUserSafe(err)`, `toJSON(err)`, `fromJSON(obj)`, `wrap(fn, opts)`, `assert(condition, code, message)`, `codes.register(code, defaults)`, `codes.lookup(code)`, `match(err, handlers)`, `aggregate(errors)`, `boundary(fn, fallback)`

Implementation guide: [BareMetal.Errors.md](BareMetal.Errors.md)

## BareMetal.Expressions

```html
<script src="src/BareMetal.Expressions.js"></script>
```

```js
const names = BareMetal.Expressions.list();
```

### Public API

`list()`, `info(name)`, `detect(value)`, `register(name, cfg)`, `register()`

Implementation guide: [BareMetal.Expressions.md](BareMetal.Expressions.md)

## BareMetal.FileIO

```html
<script src="src/BareMetal.FileIO.js"></script>
```

```js
const file = await BareMetal.FileIO.open({
  accept: ['application/json', '.json'],
  description: 'JSON files'
});
```

### Public API

`open(options)`, `openText(options)`, `openJSON(options)`, `openBinary(options)`, `openDataURL(options)`, `openDirectory()`, `save(content, options)`, `download(content, filename, type)`, `downloadUrl(url, filename)`, `dropZone(element, options)`, `readAsText(file, encoding)`, `readAsJSON(file)`, `readAsArrayBuffer(file)`, `readAsDataURL(file)`, `readChunked(file, options)`, `stream(file)`, `pick(options)`, `formatSize(bytes)`, `ext(name)`, `isImage(file)`, `isVideo(file)`, `isAudio(file)`, `isPDF(file)`, `slice(file, start, end)`, `blobToArrayBuffer(blob)`, `blobToText(blob)`, `blobToDataURL(blob)`, `textToBlob(text, type)`, `arrayBufferToBlob(buffer, type)`, `hasFileSystemAccess()`, `hasDragDrop()`

Implementation guide: [BareMetal.FileIO.md](BareMetal.FileIO.md)

## BareMetal.Font

```html
<script src="src/BareMetal.Font.js"></script>
```

```js
BareMetal.Font.create('#slot', {
  family: 'Georgia, serif',
  size: 14,
  onChange({ family, size }) {}
});
```

### Public API

`el`, `get`, `set`

Implementation guide: [BareMetal.Font.md](BareMetal.Font.md)

## BareMetal.FooterBar

```html
<script src="src/BareMetal.FooterBar.js"></script>
```

```js
const foot = BareMetal.FooterBar.create('#foot', {
  status: 'Ready',
  zoom: 100,
  tabs: [{ id: 's1', label: 'Sheet1', active: true }],
  onTab(id) {},
  onZoom(percent) {}
});
foot.setStatus('A1');
```

### Public API

`el`, `setStatus`, `setTabs`, `setZoom`, `getZoom`

Implementation guide: [BareMetal.FooterBar.md](BareMetal.FooterBar.md)

## BareMetal.Forms

```html
<script src="src/BareMetal.Forms.js"></script>
```

```js
const api = BareMetal.Forms.create(form, {
  fields: {
    email: { required: true, email: true }
  }
});
```

### Public API

`create(form, schema)`, `formApi.validate()`, `formApi.getValues()`, `formApi.setValues(obj)`, `formApi.reset()`, `formApi.destroy()`, `formApi.onSubmit(cb)`, `formApi.onChange(cb)`, `formApi.getState()`, `getState(form)`, `serialize(form)`, `deserialize(form, data)`, `validate(root, rules)`, `mask(input, pattern)`, `wizard(container, steps)`, `wizardApi.next()`, `wizardApi.getCurrentStep()`, `wizardApi.isFirst()`, `wizardApi.onStep(cb)`, `wizardApi.submit()`, `repeater(container, opts)`, `repeaterApi.add(data)`, `repeaterApi.remove(index)`, `repeaterApi.getAll()`, `repeaterApi.onAdd(cb)`, `repeaterApi.destroy()`, `autosave(form, opts)`, `autosaveApi.restore()`, `autosaveApi.clear()`, `conditional(form, rules)`, `submit(form, handler, opts)`, `fromJSON(container, schema)`, `toFormData(form)`, `diff(form)`, `focus(form, opts)`

Implementation guide: [BareMetal.Forms.md](BareMetal.Forms.md)

## BareMetal.Gallery

```html
<script src="src/BareMetal.Gallery.js"></script>
```

```js
<link rel="stylesheet" href="BareMetal.Gallery.css">
<script src="BareMetal.Gallery.js"></script>
<section id="library"></section>
<script>
const gallery = BareMetal.Gallery.create({
  label: 'Your media',
  onFavourite: async (id, favourite) => {
    // Persist through your authenticated application API.
    return {favourite};
  },
  onError: error => console.error(error.message)
});
document.querySelector('#library').append(gallery.element);
const card = gallery.card('clip-1', 'Summer walk', {
  kind: 'video', category: 'Nature', tags: ['forest', 'summer'],
  description: 'A gentle walk through the woods',
  state: 'done', created: Date.now(), favourite: false
});
card.preview.append(gallery.media({
  url: '/media/walk.mp4', mime: 'video/mp4', name: 'Summer walk'
}));
</script>
```

### Public API

``

Implementation guide: [BareMetal.Gallery.md](BareMetal.Gallery.md)

## BareMetal.Gamepad

```html
<script src="src/BareMetal.Gamepad.js"></script>
```

```js
const pads = BareMetal.Gamepad.poll();
console.log(pads[0]);
```

### Public API

`poll()`, `on(event, callback)`, `off(event, callback)`, `start(opts)`, `stop()`, `getState(index)`, `isPressed(index, button)`, `getAxis(index, axisIndex)`, `vibrate(index, opts)`, `map(index, mapping)`, `combo(index, sequence, callback, opts)`, `combo.cancel()`, `deadzone(value, threshold)`, `normalize(gamepad)`, `profiles`

Implementation guide: [BareMetal.Gamepad.md](BareMetal.Gamepad.md)

## BareMetal.Geo

```html
<script src="src/BareMetal.Geo.js"></script>
```

```js
const pos = await BareMetal.Geo.getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 10000
});
```

### Public API

`getCurrentPosition(opts)`, `watchPosition(callback, opts)`, `clearWatch(watchId)`, `distance(p1, p2)`, `bearing(p1, p2)`, `midpoint(p1, p2)`, `boundingBox(center, radiusMeters)`, `isInside(point, polygon)`, `encode(lat, lng, precision)`, `decode(hash)`, `track(opts)`, `tracker.start()`, `tracker.stop()`, `tracker.getPath()`, `tracker.getDistance()`, `tracker.onUpdate(cb)`, `geocode(address)`, `reverseGeocode(lat, lng)`

Implementation guide: [BareMetal.Geo.md](BareMetal.Geo.md)

## BareMetal.Graph

```html
<script src="src/BareMetal.Graph.js"></script>
```

```js
const graph = BareMetal.Graph.create('#services', {
  nodes: [
    { id: 'gateway', label: 'Gateway', group: 'edge' },
    { id: 'orders', label: 'Orders', group: 'services', detail: 'Handles checkout' },
    { id: 'postgres', label: 'Postgres', group: 'data', pinned: true }
  ],
  edges: [
    { source: 'gateway', target: 'orders', label: 'HTTP', weight: 2 },
    { source: 'orders', target: 'postgres', label: 'SQL' }
  ]
}, {
  directed: true,
  groupField: 'group'
});
```

### Public API

`create(target, data, options)`, `graphHandle.svg`, `graphHandle.simulation`, `graphHandle.nodes`, `graphHandle.edges`, `graphHandle.addNode(node)`, `graphHandle.addEdge(edge)`, `graphHandle.removeNode(id)`, `graphHandle.removeEdge(source, target)`, `graphHandle.pin(id)`, `graphHandle.unpin(id)`, `graphHandle.stop()`, `graphHandle.restart()`, `graphHandle.destroy()`

Implementation guide: [BareMetal.Graph.md](BareMetal.Graph.md)

## BareMetal.I18n

```html
<script src="src/BareMetal.I18n.js"></script>
```

```js
BareMetal.I18n.setLocale('fr-CA');
```

### Public API

`setLocale(code)`, `getLocale()`, `configure(opts)`, `addMessages(locale, messages)`, `t(key, params)`, `loadMessages(locale, url)`, `isRTL(locale)`, `subscribe(fn)`, `configure()`

Implementation guide: [BareMetal.I18n.md](BareMetal.I18n.md)

## BareMetal.ID3

```html
<script src="src/BareMetal.ID3.js"></script>
```

```js
const tags = await BareMetal.ID3.read(file);
console.log(tags.title, tags.artist, tags.album, tags.track, tags.picture);
```

### Public API

`title`, `artist`, `album`, `year`, `comment`, `track`, `genre`

Implementation guide: [BareMetal.ID3.md](BareMetal.ID3.md)

## BareMetal.IDB

```html
<script src="src/BareMetal.IDB.js"></script>
```

```js
const db = await BareMetal.IDB.open('crm', {
  version: 2,
  stores: {
    contacts: {
      keyPath: 'id',
      indexes: [
        { name: 'byEmail', keyPath: 'email', unique: true },
        { name: 'byCompany', keyPath: 'company' }
      ]
    }
  }
});
```

### Public API

`open(name, opts)`, `isSupported()`, `databases()`, `deleteDatabase(name)`, `kv(name)`, `db.close()`, `db.stores()`, `db.put(store, value)`, `db.putAll(store, values)`, `db.get(store, key)`, `db.getAll(store, opts)`, `db.delete(store, key)`, `db.deleteAll(store, keys)`, `db.clear(store)`, `db.count(store)`, `db.getBy(store, index, value)`, `db.getAllBy(store, index, value, opts)`, `db.range(store, index, opts)`, `db.each(store, cb)`, `db.eachBy(store, index, opts, cb)`, `db.filter(store, cb)`, `db.transaction(stores, mode, fn)`, `db.batch(store, op, items)`, `db.export(store)`, `db.import(store, data)`, `kvStore.set(key, value)`, `kvStore.get(key)`, `kvStore.delete(key)`, `kvStore.has(key)`, `kvStore.keys()`, `kvStore.clear()`, `kvStore.close()`

Implementation guide: [BareMetal.IDB.md](BareMetal.IDB.md)

## BareMetal.Inbox

```html
<script src="src/BareMetal.Inbox.js"></script>
```

```js
const moduleApi = BareMetal.Inbox;
// Source: ./src/BareMetal.Inbox.js
// See the public API list below for call signatures.
```

### Public API

`create(options)`

Implementation guide: [modules/BareMetal.Inbox.md](modules/BareMetal.Inbox.md)

## BareMetal.InputRouter

```html
<script src="src/BareMetal.InputRouter.js"></script>
```

```js
const router = BareMetal.InputRouter.create({ element:document, onAction:event => console.log(event.action) });
```

### Public API

`create(options)`

Implementation guide: [modules/BareMetal.InputRouter.md](modules/BareMetal.InputRouter.md)

## BareMetal.Integrity

```html
<script src="src/BareMetal.Integrity.js"></script>
```

```js
<script src="src/BareMetal.Integrity.js"></script>
<script>
const digest = await BareMetal.Integrity.sha256(moduleBytes);
const valid = await BareMetal.Integrity.verify(moduleBytes, expectedDigest);

const result = await BareMetal.Integrity.verifyManifest({
  version: 1,
  algorithm: 'SHA-256',
  revision: 'source revision or commit',
  modules: {
    'BareMetal.Bind': {
      path: 'src/BareMetal.Bind.min.js',
      sha256: '64-character hex digest'
    }
  }
}, { baseUrl: '/' });

if (!result.ok) throw new Error('Module integrity failed');
</script>
```

### Public API

`version`, `algorithm`, `revision`, `commit`, `source`, `modules`

Implementation guide: [BareMetal.Integrity.md](BareMetal.Integrity.md)

## BareMetal.Launcher

```html
<script src="src/BareMetal.Launcher.js"></script>
```

```js
const store = BareMetal.Launcher.createStore({ sessions: [] });
store.subscribe(state => console.log(state.sessions.length));
store.set({ sessions: [{ id: 's1', status: 'running' }] });
```

### Public API

`createStore(initial)`, `createApi(options)`, `renderSessionCards(container, sessions, options)`, `createSocket(url, options)`, `attachTerminal(target, socket, options)`, `createLauncher(container, options)`

Implementation guide: [BareMetal.Launcher.md](BareMetal.Launcher.md)

## BareMetal.LocalKVStore

```html
<script src="src/BareMetal.LocalKVStore.js"></script>
```

```js
const cache = BareMetal.LocalKVStore.create({
  backend: 'local',
  namespace: 'app-cache',
  ttl: 60
});
```

### Public API

`create(options)`, `store.get(key)`, `store.set(key, value, ttl)`, `store.remove(key)`, `store.has(key)`, `store.clear()`, `store.getMany(keys)`, `store.setMany(entries, ttl)`, `store.removeMany(keys)`, `store.keys()`, `store.values()`, `store.entries()`, `store.count()`, `store.find(predicate)`, `store.ttl(key)`, `store.expire(key, ttl)`, `store.persist(key)`, `store.cleanup()`, `store.size()`, `store.onChange(callback)`, `create()`

Implementation guide: [BareMetal.LocalKVStore.md](BareMetal.LocalKVStore.md)

## BareMetal.Logger

```html
<script src="src/BareMetal.Logger.js"></script>
```

```js
var log = BareMetal.Logger.create({
  level: 'debug',
  context: { service: 'checkout' }
});
```

### Public API

`create(opts)`, `console(record)`, `beacon(url)`, `logger.debug(msg, data)`, `logger.info(msg, data)`, `logger.warn(msg, data)`, `logger.error(msg, data)`, `logger.child(extraContext)`, `logger.setLevel(level)`, `logger.addTransport(fn)`, `create()`

Implementation guide: [BareMetal.Logger.md](BareMetal.Logger.md)

## BareMetal.Markdown

```html
<script src="src/BareMetal.Markdown.js"></script>
```

```js
var html = BareMetal.Markdown.render('# Hello\n\nVisit [Docs](guide.md)', {
  baseUrl: '/help/'
});
```

### Public API

`render(input, options)`, `inline(input, options)`, `renderTo(el, input, options)`, `renderSafe(el, input, options)`, `createRenderer(options)`, `toc(input, options)`, `frontMatter(input)`, `escape(value)`

Implementation guide: [BareMetal.Markdown.md](BareMetal.Markdown.md)

## BareMetal.Media

```html
<script src="src/BareMetal.Media.js"></script>
```

```js
const cam = await BareMetal.Media.camera({ facingMode: 'environment' });
cam.stop();
```

### Public API

`camera(opts)`, `microphone(opts)`, `screen(opts)`, `snapshot(videoEl, opts)`, `record(stream, opts)`, `recorder.start()`, `recorder.pause()`, `recorder.stop()`, `recorder.onData(cb)`, `recorder.getBlob()`, `devices()`, `switchCamera(stream, deviceId)`, `pip(videoEl)`, `torch(stream, on)`, `preview(stream, container, opts)`, `preview.destroy()`, `constraints(stream)`, `audioContext(stream)`, `analyser.getFrequency()`, `analyser.getWaveform()`

Implementation guide: [BareMetal.Media.md](BareMetal.Media.md)

## BareMetal.MermaidDiagramRenderer

```html
<script src="src/BareMetal.MermaidDiagramRenderer.js"></script>
```

```js
<link rel="stylesheet" href="BareMetal.MermaidDiagramRenderer.css">
<script src="BareMetal.MermaidDiagramRenderer.js"></script>
```

### Public API

``

Implementation guide: [BareMetal.MermaidDiagramRenderer.md](BareMetal.MermaidDiagramRenderer.md)

## BareMetal.Metadata

```html
<script src="src/BareMetal.Metadata.js"></script>
```

```js
const customer = BareMetal.Metadata.register({
  name: 'Customer',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'tier', type: 'text', enumValues: ['Bronze', 'Silver', 'Gold'] }
  ]
});
```

### Public API

`register(meta)`, `get(slug)`, `list()`, `remove(slug)`, `scanInline()`, `fetchAndRegister(url)`, `toTemplateFields(metaOrSlug)`, `renderForm(slugOrMeta, rootElement, state, watch)`, `renderTable(slugOrMeta, rootElement, items, callbacks)`, `fromBinary(buffer)`

Implementation guide: [BareMetal.Metadata.md](BareMetal.Metadata.md)

## BareMetal.MIDI

```html
<script src="src/BareMetal.MIDI.js"></script>
```

```js
const midi = BareMetal.MIDI.create();
await midi.request();

midi.mapCC(1, message => player.setPitchBend(message.value * 2 - 1));
midi.mapPitchBend(message => player.setPitchBend(message.value * 2));
midi.onMessage(message => console.log(message));
```

### Public API

`inputs`, `outputs`

Implementation guide: [BareMetal.MIDI.md](BareMetal.MIDI.md)

## BareMetal.MIDIProfiles

```html
<script src="src/BareMetal.MIDIProfiles.js"></script>
```

```js
const profiles = BareMetal.MIDIProfiles.create();
await profiles.importJson(profileJson);
profiles.activate('OMNIS-DUO');
profiles.learn('deckA.play', { mode: 'toggle' });
const mapping = profiles.capture(message);
const portableJson = profiles.exportJson('OMNIS-DUO');
```

### Public API

`profile`, `version`, `verified`, `mappings`, `feedback`, `note`

Implementation guide: [BareMetal.MIDIProfiles.md](BareMetal.MIDIProfiles.md)

## BareMetal.Minifier

```html
<script src="src/BareMetal.Minifier.js"></script>
```

```js
const min = BareMetal.Minifier.minifyJS(source);
const packed = await BareMetal.Minifier.compressGzip(min.code);
```

### Public API

`minifyJS(source, options)`, `minifyCSS(source, options)`, `compressGzip(source, options)`, `decompressGzip(source, options)`

Implementation guide: [modules/BareMetal.Minifier.md](modules/BareMetal.Minifier.md)

## BareMetal.Modal

```html
<script src="src/BareMetal.Modal.js"></script>
```

```js
const modal = BareMetal.Modal.create({title: 'Sign in', content: loginForm});
modal.open();
modal.setBusy(true); // Blocks Escape and close while a request is pending.
modal.setBusy(false);
modal.close();
```

### Public API

``

Implementation guide: [BareMetal.Modal.md](BareMetal.Modal.md)

## BareMetal.ModuleLoader

```html
<script src="src/BareMetal.ModuleLoader.js"></script>
```

```js
<script src="src/BareMetal.Integrity.js"></script>
<script src="src/BareMetal.ModuleLoader.js"></script>
<script>
const modules = BareMetal.ModuleLoader.create({
  manifestUrl: '/modules.manifest.json',
  baseUrl: '/',
  requireIntegrity: true,
  cache: 'no-store'
});

await modules.load('BareMetal.Bind');
await modules.loadAll();
</script>
```

### Public API

``

Implementation guide: [BareMetal.ModuleLoader.md](BareMetal.ModuleLoader.md)

## BareMetal.MP3

```html
<script src="src/BareMetal.MP3.js"></script>
```

```js
const tags = await BareMetal.MP3.readTags(file);

const audio = BareMetal.MP3.stream('/audio/track.mp3', {
  preload: 'metadata',
  controls: true
});

const player = BareMetal.MP3.create({
  volume: 0.8,
  crossfade: 2
});
player.setPlaylist([{ src: '/audio/track.mp3', title: tags.title }]);
player.setPitch(1);
player.setPitchBend(-0.25);
player.setLow(3);
player.setMid(-1);
player.setHigh(2);
```

### Public API

`readTags`, `create`, `stream`, `loadCatalog`

Implementation guide: [BareMetal.MP3.md](BareMetal.MP3.md)

## BareMetal.MP3Catalog

```html
<script src="src/BareMetal.MP3Catalog.js"></script>
```

```js
const catalog = BareMetal.MP3Catalog.create();
catalog.addMany([
  { id: 'a', title: 'Blue Monday', artist: 'New Order',
    album: 'Brotherhood', genre: 'Synthpop', year: '1986',
    tags: ['80s', 'electronic'], src: '/audio/blue-monday.mp3' }
]);

catalog.search('blue electronic');
catalog.search('', { artist: 'New Order', year: '1986', tag: 'electronic' });

const manifest = catalog.manifest({ revision: 'v1' });
```

### Public API

`version`, `title`, `revision`, `entries`

Implementation guide: [BareMetal.MP3Catalog.md](BareMetal.MP3Catalog.md)

## BareMetal.MusicPlayer

```html
<script src="src/BareMetal.MusicPlayer.js"></script>
```

```js
<script src="BareMetal.MusicPlayer.js"></script>
<script>
  const music = BareMetal.MusicPlayer.create({ volume: 0.2, crossfade: 3, repeat: 'all' });
  music.setPlaylist([
    { src: '/media/ambient-a.mp3', title: 'Ambient A' },
    { src: '/media/ambient-b.mp3', title: 'Ambient B' }
  ], { shuffle: true });
  document.querySelector('#play').addEventListener('click', () => music.play());
  music.on('trackchange', ({ entry }) => console.log('Now playing', entry.title));
</script>
```

### Public API

`index`, `currentTime`, `volume`, `pitchBendSemitones`, `highDb`, `streaming`

Implementation guide: [BareMetal.MusicPlayer.md](BareMetal.MusicPlayer.md)

## BareMetal.Notify

```html
<script src="src/BareMetal.Notify.js"></script>
```

```js
const toast = BareMetal.Notify.toast('Profile updated', {
  type: 'success',
  title: 'Account',
  duration: 2500
});
```

### Public API

`toast(message, options)`, `success(message, options)`, `error(message, options)`, `warning(message, options)`, `info(message, options)`, `banner(message, options)`, `dismiss(id)`, `dismissAll()`, `count()`, `configure(options)`, `requestPermission()`, `permission()`, `native(title, options)`, `send(title, options)`, `progress(message, options)`, `progress().update(value, message)`, `progress().complete(message)`, `progress().error(message)`, `progress().dismiss()`, `isSupported()`, `isSecureContext()`

Implementation guide: [BareMetal.Notify.md](BareMetal.Notify.md)

## BareMetal.Observe

```html
<script src="src/BareMetal.Observe.js"></script>
```

```js
const watch = BareMetal.Observe.resize(panel, function (size) {
  console.log(size.width, size.height);
}, { debounce: 100 });
```

### Public API

`resize(el, callback, opts)`, `intersection(el, callback, opts)`, `mutation(el, callback, opts)`, `lazyLoad(selector, opts)`, `infinite(sentinel, loadMore, opts)`, `sticky(el, opts)`, `viewport(el)`, `trackSize(el, callback, opts)`, `breakpoint(el, breakpoints, callback)`, `animateOnScroll(els, opts)`, `mediaQuery(query, callback)`, `mutationStream(el, opts)`

Implementation guide: [BareMetal.Observe.md](BareMetal.Observe.md)

## BareMetal.OfflineData

```html
<script src="src/BareMetal.OfflineData.js"></script>
```

```js
const db = await BareMetal.IDB.open('orders-v1', {
  version: 1,
  stores: {
    orders: { keyPath: 'id' },
    outbox: { keyPath: 'id' }
  }
});

const offline = BareMetal.OfflineData.create({
  db,
  recordStore: 'orders',
  outboxStore: 'outbox',
  send: async operation => {
    const response = await fetch(operation.request.url, {
      method: operation.request.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operation.optimistic)
    });
    if (!response.ok) {
      const error = new Error('Save failed: ' + response.status);
      error.status = response.status;
      if (response.status === 409 || response.status === 412) error.remote = await response.json();
      throw error;
    }
    return response.status === 204 ? undefined : response.json();
  }
});

await offline.put('PO-1042', updatedOrder, {
  method: 'PUT',
  url: '/api/orders/PO-1042'
});
```

### Public API

`create(options)`, `client.mutate(input)`, `client.put(key, value, request)`, `client.remove(key, request)`, `client.get(key)`, `client.pending()`, `client.flush()`, `client.resolve(id, choice)`, `client.on(event, handler)`, `client.mountConflictUI(target)`, `client.startAutoSync()`, `client.destroy()`

Implementation guide: [BareMetal.OfflineData.md](BareMetal.OfflineData.md)

## BareMetal.Pay

```html
<script src="src/BareMetal.Pay.js"></script>
```

```js
if (!BareMetal.Pay.canPay()) console.warn('Payment Request API unavailable');
```

### Public API

`canPay()`, `request(details, methods, opts)`, `card(opts)`, `googlePay(config)`, `applePay(config)`, `formatCurrency(amount, currency, locale)`, `cart(seed)`, `cart.add(item)`, `cart.remove(id)`, `cart.update(id, qty)`, `cart.clear()`, `cart.getTotal(currency)`, `cart.getItems()`, `cart.toDetails(label)`, `shipping(options)`, `shipping.add(id, label, amount, selected)`, `shipping.getSelected()`, `shipping.toArray()`, `validate(cardNumber)`, `abort(response)`, `complete(response, result)`, `retry(response, errors)`

Implementation guide: [BareMetal.Pay.md](BareMetal.Pay.md)

## BareMetal.PicoScript

```html
<script src="src/BareMetal.PicoScript.js"></script>
```

```js
var vm = new ps.VM(opts);
vm.run(words);         // execute bytecode
vm.step();             // single-step (for debuggers)
vm.regs                // register file (R0-R15)
vm.output              // output buffer (bytes)
vm.halted              // true when execution complete
vm.steps               // instruction count
```

### Public API

`label`, `name`, `value`, `description`, `locale`

Implementation guide: [BareMetal.PicoScript.md](BareMetal.PicoScript.md)

## BareMetal.Pipeline

```html
<script src="src/BareMetal.Pipeline.js"></script>
```

```js
const pipeline = BareMetal.Pipeline.create(
  value => value + 1,
  value => value * 2
);
```

### Public API

`create(...stages)`, `compose(...fns)`, `series(fns, input, ctx)`, `parallel(fns, input, ctx)`, `waterfall(fns)`, `stream(iterable)`, `backpressure(producer, consumer, opts)`

Implementation guide: [BareMetal.Pipeline.md](BareMetal.Pipeline.md)

## BareMetal.Pivot

```html
<script src="src/BareMetal.Pivot.js"></script>
```

```js
<script src="BareMetal.Charts.js"></script>
<script src="BareMetal.Pivot.js"></script>
<div id="pivot"></div>
<script>
  BareMetal.Pivot.create('#pivot', {
    fields: ['Item', 'Qty'],
    records: [
      { Item: 'Paper', Qty: 12 },
      { Item: 'Ink', Qty: 4 },
      { Item: 'Paper', Qty: 3 }
    ],
    groupBy: 'Item',
    valueField: 'Qty',
    op: 'sum'
  });
</script>
```

### Public API

`fields`, `groupBy`, `valueField`, `op`, `sort`, `sortDir`, `filter`

Implementation guide: [BareMetal.Pivot.md](BareMetal.Pivot.md)

## BareMetal.Play

```html
<script src="src/BareMetal.Play.js"></script>
```

```js
{ stories: 1, nodes: 2, choices: 3, personas: 4, templates: 5, user_progress: 6 }
```

### Public API

`PACKS`, `mount(target, options?)`, `memoryClient(seed)`, `freshState()`, `matchConditions(state, conditions)`, `applyEffects(state, effects)`, `entryNode(nodes, choices, state)`, `offeredChoices(node, nodes, choices, state)`, `fillText(text, ctx)`, `sceneText(node, progress, persona)`, `withPersonaFacts(state, personas, storyId)`, `narratorOf(personas, storyId)`, `slipsFor(node, templates, progress, persona)`, `fireTriggers(node, templates, progress, persona)`

Implementation guide: [BareMetal.Play.md](BareMetal.Play.md)

## BareMetal.Print

```html
<script src="src/BareMetal.Print.js"></script>
```

```js
const result = await BareMetal.Print.print(invoiceHtml, {
  device: 'pdf',
  title: 'Invoice INV-1042',
  pageSize: 'A4'
});
const url = URL.createObjectURL(result.blob);
downloadLink.href = url;
downloadLink.download = 'invoice-1042.pdf';
```

### Public API

`render(document, options)`, `paginate(document, options)`, `print(document, options)`, `preview(document, options)`, `receipt(data, options)`, `invoice(data, options)`, `document(data, options)`, `barcode(value, options)`, `qr(value, options)`

Implementation guide: [BareMetal.Print.md](BareMetal.Print.md)

## BareMetal.Progressive

```html
<script src="src/BareMetal.Progressive.js"></script>
```

```js
BareMetal.Progressive.register('/sw.js', {
  scope: '/app/',
  onInstalled: function () { console.log('App cached for first install'); },
  onUpdate: function () { console.log('Update available'); },
  onActivated: function () { console.log('New worker activated'); },
  onError: function (err) { console.error(err); }
});
```

### Public API

`register(swUrl, opts)`, `unregister()`, `getRegistration()`, `update()`, `onInstallPrompt(callback)`, `isInstalled()`, `isInstallable()`, `precache(urls)`, `clearCache(cacheName)`, `getCacheStatus()`, `isOnline()`, `onConnectivityChange(callback)`, `requestSync(tag)`, `subscribePush(vapidPublicKey)`, `unsubscribePush()`, `getPushSubscription()`, `generateManifest(opts)`, `injectManifest(opts)`, `postMessage(msg)`, `onMessage(callback)`, `register()`, `generateManifest()`

Implementation guide: [BareMetal.Progressive.md](BareMetal.Progressive.md)

## BareMetal.PubSub

```html
<script src="src/BareMetal.PubSub.js"></script>
```

```js
const appBus = BareMetal.PubSub.create();
const auditBus = BareMetal.PubSub.create();
```

### Public API

`create()`, `on(topic, handler, opts)`, `once(topic, handler, opts)`, `emit(topic, data, opts)`, `sticky(topic, data, opts)`, `off(topic, handler)`, `offAll(topic)`, `offNs(ns)`, `clear()`, `use(pattern, fn)`, `handle(topic, handler)`, `request(topic, data)`, `channel(topic, opts)`, `topics()`, `subscribers(topic)`, `has(topic)`, `channel.emit(data, emitOpts)`, `channel.subscribe(fn, subOpts)`, `channel.history()`, `channel.last()`, `channel.destroy()`

Implementation guide: [BareMetal.PubSub.md](BareMetal.PubSub.md)

## BareMetal.RBAC

```html
<script src="src/BareMetal.RBAC.js"></script>
```

```js
console.warn(BareMetal.RBAC.WARNING);
```

### Public API

`WARNING`, `configure(options)`, `identity()`, `isAuthenticated()`, `hasRole(role)`, `hasAnyRole(roles)`, `hasAllRoles(roles)`, `inGroup(group)`, `inAnyGroup(groups)`, `inAllGroups(groups)`, `can(permission)`, `canAny(permissions)`, `canAll(permissions)`, `hasScope(scope)`, `hasAnyScope(scopes)`, `check(criteria)`, `checkAny(criteria)`, `guard(criteria)`, `applyDOM(rootElement)`, `setToken(token)`, `clearToken()`, `refresh()`, `onExpiry(callback)`, `tenant()`, `isTenant(value)`, `configure()`

Implementation guide: [BareMetal.RBAC.md](BareMetal.RBAC.md)

## BareMetal.Rendering

```html
<script src="src/BareMetal.Rendering.js"></script>
```

```js
const customer = await BareMetal.Rendering.createEntity('customer');
await customer.load(42);
customer.renderUI(document.getElementById('editor'));
```

### Public API

`createEntity(slug)`, `listEntities()`, `window.minibind`

Implementation guide: [BareMetal.Rendering.md](BareMetal.Rendering.md)

## BareMetal.Ribbon

```html
<script src="src/BareMetal.Ribbon.js"></script>
```

```js
BareMetal.Ribbon.create('#bar', {
  groups: [
    { label: 'Style', items: [
      { id: 'bold', label: 'B', toggle: true },
      { id: 'fill', type: 'colour', value: '#ffffff' },
      { id: 'font', type: 'font', family: 'Georgia, serif', size: 12 }
    ]}
  ],
  onCommand(id, item, extra) {}
});
```

### Public API

`el`, `item`, `setActive`, `setDisabled`, `setColour`, `setFont`

Implementation guide: [BareMetal.Ribbon.md](BareMetal.Ribbon.md)

## BareMetal.Routing

```html
<script src="src/BareMetal.Routing.js"></script>
```

```js
BMRouter.on('/projects/:id/edit', ({ id }, query) => openEditor(id, query.tab));
```

### Public API

`on(pattern, handler)`, `notFound(handler)`, `start()`, `navigate(path, state, replace)`, `window.BMRouter`

Implementation guide: [BareMetal.Routing.md](BareMetal.Routing.md)

## BareMetal.Scan

```html
<script src="src/BareMetal.Scan.js"></script>
```

```js
const moduleApi = BareMetal.Scan;
// Source: ./src/BareMetal.Scan.js
// See the public API list below for call signatures.
```

### Public API

`capture(options)`, `stream(options)`, `decode(image, options)`, `decodeQR(image, options)`, `decodeBarcode(image, options)`, `ocr(image, options)`, `map(value, options)`, `validate(result, options)`, `continuous(options)`, `overlay(result, options)`, `history()`, `fromImage(image, options)`, `fromBlob(blob, options)`

Implementation guide: [modules/BareMetal.Scan.md](modules/BareMetal.Scan.md)

## BareMetal.SceneInspector

```html
<script src="src/BareMetal.SceneInspector.js"></script>
```

```js
const inspector = BareMetal.SceneInspector.create({ targets:[scene], adapter });
document.querySelector('#app').append(inspector.element);
```

### Public API

`create(options)`

Implementation guide: [modules/BareMetal.SceneInspector.md](modules/BareMetal.SceneInspector.md)

## BareMetal.Schedule

```html
<script src="src/BareMetal.Schedule.js"></script>
```

```js
const moduleApi = BareMetal.Schedule;
// Source: ./src/BareMetal.Schedule.js
// See the public API list below for call signatures.
```

### Public API

`cron(expression, callback, options)`, `interval(ms, callback)`, `delay(ms, callback)`, `at(date, callback)`, `every(interval, callback)`, `queue(options)`, `scheduler(options)`, `debounce(fn, wait)`, `throttle(fn, wait)`, `retry(fn, options)`

Implementation guide: [modules/BareMetal.Schedule.md](modules/BareMetal.Schedule.md)

## BareMetal.Schema

```html
<script src="src/BareMetal.Schema.js"></script>
```

```js
const Name = BareMetal.Schema.string({ trim: true, min: 2 });
```

### Public API

`string(opts)`, `number(opts)`, `boolean(opts)`, `array(itemSchema, opts)`, `object(shape, opts)`, `date(opts)`, `oneOf(schemas)`, `nullable(schema)`, `optional(schema)`, `custom(name, validateFn, opts)`, `parse(schema, data)`, `validate(schema, data)`, `transform(schema, data)`, `coerce(schema, data)`, `defaults(schema)`, `extend(baseSchema, overrides)`, `pick(schema, keys)`, `omit(schema, keys)`, `partial(schema)`, `version(schema, v, migrations)`, `versionedSchema.migrate(data, fromV, toV)`, `toJSON(schema)`, `fromJSON(descriptor)`, `toBinary(schema, opts)`, `fromBinary(binarySchema)`

Implementation guide: [BareMetal.Schema.md](BareMetal.Schema.md)

## BareMetal.Search

```html
<script src="src/BareMetal.Search.js"></script>
```

```js
const moduleApi = BareMetal.Search;
// Source: ./src/BareMetal.Search.js
// See the public API list below for call signatures.
```

### Public API

`createIndex(options)`, `tokenize(text, options)`, `stem(token, language)`, `highlight(text, terms)`, `pipeline(options)`

Implementation guide: [modules/BareMetal.Search.md](modules/BareMetal.Search.md)

## BareMetal.SecureTransport

```html
<script src="src/BareMetal.SecureTransport.js"></script>
```

```js
<script src="src/BareMetal.SecureTransport.js"></script>
<script>
const secure = BareMetal.SecureTransport.create({
  publicKeyUrl: '/api/security/public-key',
  keyId: '2026-11',
  tunnelUrl: '/bmsecure'
});

const response = await secure.fetch('/api/customers', {
  method: 'GET'
});
</script>
```

### Public API

`envelope`, `method`, `url`, `headers`, `body`, `credentials`, `ok`, `status`, `statusText`, `arrayBuffer`, `text`, `json`, `rsaKey`, `aesKey`

Implementation guide: [BareMetal.SecureTransport.md](BareMetal.SecureTransport.md)

## BareMetal.ServiceWorker

```html
<script src="src/BareMetal.ServiceWorker.js"></script>
```

```js
sendToWorker({ type: 'BM_PRECACHE', urls: ['/', '/offline.json'] });
```

### Public API

`BM_PRECACHE`, `BM_CLEAR_CACHE`, `BM_CACHE_STATUS`, `BM_SET_ROUTES`, `BM_SKIP_WAITING`, `BM_SET_OFFLINE_PAGE`, `cacheFirst(request, cacheName)`, `networkFirst(request, cacheName)`, `staleWhileRevalidate(request, cacheName)`, `networkOnly(request)`, `cacheOnly(request, cacheName)`

Implementation guide: [BareMetal.ServiceWorker.md](BareMetal.ServiceWorker.md)

## BareMetal.Session

```html
<script src="src/BareMetal.Session.js"></script>
```

```js
const session = BareMetal.Session.create({
  ttl: 15 * 60 * 1000,
  refreshBefore: 60 * 1000,
  storage: 'localStorage',
  syncTabs: true
});
```

### Public API

`create(opts)`, `tabSync(key)`, `guard(checkFn, redirectFn)`, `fingerprint()`, `activity(opts)`

Implementation guide: [BareMetal.Session.md](BareMetal.Session.md)

## BareMetal.Sheet

```html
<script src="src/BareMetal.Sheet.js"></script>
```

```js
<script src="BareMetal.Sheet.js"></script>
<div id="sheet" style="height:24rem"></div>
<script>
  const sheet = BareMetal.Sheet.create('#sheet', {
    rows: 20,
    cols: 10,
    cells: { A1: { v: 'Hello', s: { bold: true } } },
    onChange(addr, cell, prev) { console.log(addr, cell); }
  });
  sheet.setCell('B2', { v: '42' });
</script>
```

### Public API

`c`, `c0`, `r0`, `c1`, `r1`

Implementation guide: [BareMetal.Sheet.md](BareMetal.Sheet.md)

## BareMetal.Speech

```html
<script src="src/BareMetal.Speech.js"></script>
```

```js
<button id="talkBtn">Speak</button>
<button id="listenBtn">Listen</button>

<script src="BareMetal.Speech.min.js"></script>
<script>
  document.getElementById('talkBtn').addEventListener('click', function () {
    BareMetal.Speech.speak('Hello from BareMetal', { lang: 'en-GB', rate: 1 });
  });

  document.getElementById('listenBtn').addEventListener('click', function () {
    const session = BareMetal.Speech.listen({ lang: 'en-US', interimResults: true });
    session
      .onInterim(function (result) { console.log('Interim:', result.transcript); })
      .onResult(function (result) { console.log('Final:', result.transcript); });
  });
</script>
```

### Public API

`speak(text, opts)`, `pause()`, `voices(lang)`, `isSpeaking()`, `listen(opts)`, `command(phrases, callback, opts)`, `dictate(opts)`, `queue(items)`

Implementation guide: [BareMetal.Speech.md](BareMetal.Speech.md)

## BareMetal.StateMachine

```html
<script src="src/BareMetal.StateMachine.js"></script>
```

```js
var wizard = BareMetal.StateMachine.create({
  initial: 'step1',
  context: { valid: false },
  states: {
    step1: {
      on: {
        NEXT: {
          target: 'step2',
          guard: function (ctx) { return ctx.valid; }
        }
      }
    },
    step2: {}
  }
});
```

### Public API

`create(config)`, `machine.send(event)`, `machine.getState()`, `machine.getContext()`, `machine.matches(stateName)`, `machine.subscribe(fn)`

Implementation guide: [BareMetal.StateMachine.md](BareMetal.StateMachine.md)

## BareMetal.Story

```html
<script src="src/BareMetal.Story.js"></script>
```

```js
BareMetal.Story.mount("#app", {
  client: BareMetal.Story.memoryClient({
    stories: [{ id: 1, slug: "paper-lantern", title: "The Paper Lantern", tags: ["sample", "fiction"] }],
    nodes: [{ id: 1, story_id: 1, key: "yard", text: "The lantern sits on warm stones." }],
    choices: [],
    personas: [],
    templates: []
  })
});
```

### Public API

`PACKS`, `mount(target, options?)`, `memoryClient(seed)`, `validateConditions(value)`, `validateEffects(value)`, `validateTriggers(value)`, `validateBaseFacts(value)`, `graphData(nodes, choices)`

Implementation guide: [BareMetal.Story.md](BareMetal.Story.md)

## BareMetal.Sync

```html
<script src="src/BareMetal.Sync.js"></script>
```

```js
const ops = BareMetal.Sync.diff(
  { title: 'Draft', count: 1 },
  { title: 'Ready', count: 2 }
);
```

### Public API

`diff(a, b)`, `patch(target, ops)`, `merge(local, remote, base, strategy)`, `conflict(path, local, remote, base)`, `resolve(conflicts, resolutions)`, `queue(opts)`, `replay(ops, applyFn)`, `echo(sent, received)`, `clock(initial)`, `crdt(type, opts)`, `version(obj)`, `subscribe(syncable, callback)`, `batch(ops)`

Implementation guide: [BareMetal.Sync.md](BareMetal.Sync.md)

## BareMetal.Tabs

```html
<script src="src/BareMetal.Tabs.js"></script>
```

```js
const tabs = BareMetal.Tabs.create({ items:[{id:'one',label:'One',content:panelOne},{id:'two',label:'Two',content:panelTwo}] });
document.querySelector('#app').append(tabs.element);
```

### Public API

`create(options)`

Implementation guide: [modules/BareMetal.Tabs.md](modules/BareMetal.Tabs.md)

## BareMetal.Template

```html
<script src="src/BareMetal.Template.js"></script>
```

```js
const form = BareMetal.Template.buildForm(
  { columns: 2, fields: ['firstName', 'lastName', 'country'] },
  {
    firstName: { required: true },
    lastName: { required: true },
    country: { type: 'Country', label: 'Country/Region' }
  }
);
```

### Public API

`buildForm(layout, fields)`, `buildTable(fields, items, callbacks)`, `buildInput(name, field)`, `buildLabel(name, field)`

Implementation guide: [BareMetal.Template.md](BareMetal.Template.md)

## BareMetal.Tenant

```html
<script src="src/BareMetal.Tenant.js"></script>
```

```js
const moduleApi = BareMetal.Tenant;
// Source: ./src/BareMetal.Tenant.js
// See the public API list below for call signatures.
```

### Public API

`create(options)`, `resolve(id)`, `switch(id)`, `isolate(id, fn)`, `partition(id)`, `hierarchy(id)`, `limits(id)`, `features(id)`, `suspend(id)`, `activate(id)`

Implementation guide: [modules/BareMetal.Tenant.md](modules/BareMetal.Tenant.md)

## BareMetal.TestRunner

```html
<script src="src/BareMetal.TestRunner.js"></script>
```

```js
describe('cart totals', () => {
  describe('with tax', () => {
    it('rounds to 2 decimals', () => {
      expect(totalWithTax(19.99, 0.2)).toBeCloseTo(23.99, 2);
    });
  });
});
```

### Public API

`describe(name, fn)`, `it(name, fn, timeout)`, `test(name, fn, timeout)`, `expect(value)`, `beforeEach(fn)`, `afterEach(fn)`, `beforeAll(fn)`, `afterAll(fn)`, `mock.fn(impl)`, `mock.fetch(responses)`, `run(opts)`, `configure(opts)`, `toTAP(res)`, `toMarkdown(res, opts)`, `installGlobals()`, `run()`

Implementation guide: [BareMetal.TestRunner.md](BareMetal.TestRunner.md)

## BareMetal.ThemePicker

```html
<script src="src/BareMetal.ThemePicker.js"></script>
```

```js
const picker = BareMetal.ThemePicker.create({ themes, selected:'wavefunction', link:themeLink });
document.querySelector('#settings').append(picker.element);
```

### Public API

`create(options)`

Implementation guide: [modules/BareMetal.ThemePicker.md](modules/BareMetal.ThemePicker.md)

## BareMetal.Time

```html
<script src="src/BareMetal.Time.js"></script>
```

```js
{
  year: 2026,
  month: 4,
  day: 20,
  hour: 17,
  minute: 30,
  second: 0,
  ms: 0,
  iso: '2026-04-20T16:30:00.000Z',
  ts: 1776702600000
}
```

### Public API

`now()`, `utcNow()`, `parse(input)`, `create(year, month, day, hour, minute, second, ms)`, `fromDate(date)`, `format(dt, pattern)`, `formatRelative(dt, base)`, `toISO(dt)`, `toDate(dt)`, `add(dt, amount, unit)`, `subtract(dt, amount, unit)`, `startOf(dt, unit)`, `endOf(dt, unit)`, `isBefore(a, b)`, `isAfter(a, b)`, `isSame(a, b, precision)`, `isBetween(dt, start, end)`, `diff(a, b, unit)`, `duration(ms)`, `formatDuration(ms, opts)`, `daysInMonth(year, month)`, `isLeapYear(year)`, `dayOfWeek(dt)`, `dayOfWeekName(dt)`, `weekNumber(dt)`, `toTimezone(dt, tz)`, `getTimezone()`, `hasTemporal()`, `toTemporal(dt)`, `fromTemporal(t)`

Implementation guide: [BareMetal.Time.md](BareMetal.Time.md)

## BareMetal.Timeline

```html
<script src="src/BareMetal.Timeline.js"></script>
```

```js
const timeline = BareMetal.Timeline.create({ duration:120, onSeek:seconds => player.seek(seconds) });
document.querySelector('#player').append(timeline.element);
```

### Public API

`create(options)`, `formatTime(seconds)`

Implementation guide: [modules/BareMetal.Timeline.md](modules/BareMetal.Timeline.md)

## BareMetal.Tokens

```html
<script src="src/BareMetal.Tokens.js"></script>
```

```js
const token = await BareMetal.Tokens.sign({ sub: '123' }, 'secret', {
  algorithm: 'HS384',
  header: { kid: 'primary' }
});
```

### Public API

`sign(payload, key, options)`, `signSync(payload, key, options)`, `decode(token)`, `verify(token, key, options)`, `isExpired(token, options)`, `expiresIn(token, options)`, `claim(token, name)`, `generateSecret(algorithmName)`, `generateKeyPair(algorithmName)`, `importKey(keyData, algorithmName, kind)`, `exportKey(key)`, `importJWK(jwk, algorithmName, kind)`, `create(payload)`, `parseDuration(value)`, `toBase64Url(value)`, `fromBase64Url(value)`

Implementation guide: [BareMetal.Tokens.md](BareMetal.Tokens.md)

## BareMetal.Transport

```html
<script src="src/BareMetal.Transport.js"></script>
```

```js
const value = await BareMetal.Transport.retry(doRequest, { maxAttempts: 5, backoff: 'linear' });
```

### Public API

`retry(fn, policy)`, `backoff(attempt, policy)`, `idempotencyKey()`, `dedupe(keyFn, fn)`, `deduped.inflight()`, `coalesce(requests, opts)`, `coalescer.flush()`, `cancel(parentSignal)`, `scope.abort(reason)`, `timeout(ms)`, `timeout.clear()`, `race(promises, signal)`, `cache(fn, opts)`, `cached.clear()`, `priority(fn, level)`, `queue(opts)`, `queueApi.add(fn, level)`, `queueApi.pause()`, `queueApi.size()`, `circuit(fn, opts)`, `circuit.state()`, `rateLimit(fn, opts)`, `limited.pending()`

Implementation guide: [BareMetal.Transport.md](BareMetal.Transport.md)

## BareMetal.Types

```html
<script src="src/BareMetal.Types.js"></script>
```

```js
BareMetal.Types.define('Money', {
  fields: {
    amount: 'number',
    currency: 'string'
  }
});
```

### Public API

`define(name, descriptor)`, `check(value, type)`, `is(value, type)`, `assert(value, type)`, `cast(value, type)`, `of(value)`, `registry`, `contract(input, output)`, `guard(type)`, `union(...types)`, `intersection(...types)`, `literal(value)`, `tuple(...types)`, `record(keyType, valueType)`, `nullable(type)`, `optional(type)`, `reflect(typeName)`, `serialize(value, type)`, `deserialize(data, type)`, `equals(a, b, type)`, `clone(value, type)`

Implementation guide: [BareMetal.Types.md](BareMetal.Types.md)

## BareMetal.UndoRedo

```html
<script src="src/BareMetal.UndoRedo.js"></script>
```

```js
const history = BareMetal.UndoRedo.create({
  maxSize: 100,
  onChange: state => console.log(state)
});
```

### Public API

`create(options)`, `createSnap(options)`, `history.push(cmd)`, `history.exec(cmd)`, `history.undo()`, `history.redo()`, `history.canUndo()`, `history.canRedo()`, `history.undoName()`, `history.redoName()`, `history.size()`, `history.index()`, `history.beginGroup(name, data)`, `history.endGroup()`, `history.group(name, fn, data)`, `history.toJSON()`, `history.fromJSON(json)`, `history.clear()`, `history.clearRedo()`, `history.checkpoint()`, `history.revertTo(point)`, `history.bindKeys(el)`, `history.on(name, fn)`, `history.off(name, fn)`, `snapshotHistory.snapshot(value)`, `snapshotHistory.undo()`, `snapshotHistory.redo()`, `snapshotHistory.current()`

Implementation guide: [BareMetal.UndoRedo.md](BareMetal.UndoRedo.md)

## BareMetal.URL

```html
<script src="src/BareMetal.URL.js"></script>
```

```js
const parsed = BareMetal.URL.parse('/orders/42?tab=items#totals');
console.log(parsed.pathname, parsed.params.tab, parsed.hash);
```

### Public API

`parse(url)`, `build(parts)`, `query.encode(obj)`, `query.decode(queryString)`, `query.merge(url, paramsObject)`, `query.remove(url, keys)`, `params(pattern, url)`, `template(pattern, data)`, `join(...parts)`, `normalize(url)`, `isAbsolute(url)`, `isRelative(url)`, `resolve(base, relative)`, `compare(a, b)`, `slug(text)`, `encode(value)`, `decode(value)`, `hash.get(url)`, `hash.set(url, value)`, `origin(url)`, `isValid(url)`, `relative(from, to)`

Implementation guide: [BareMetal.URL.md](BareMetal.URL.md)

## BareMetal.Validate

```html
<script src="src/BareMetal.Validate.js"></script>
```

```js
var result = BareMetal.Validate.validate({
  age: { type: 'number', min: 18 }
}, {
  age: 16
});

console.log(result.errors[0]);
// { path: 'age', code: 'min', message: 'Must be at least 18.' }
```

### Public API

`validate(schema, data)`, `addRule(name, fn)`

Implementation guide: [BareMetal.Validate.md](BareMetal.Validate.md)

## BareMetal.Vector

```html
<script src="src/BareMetal.Vector.js"></script>
```

```js
const db = BareMetal.Vector.createDatabase();
const collection = db.createCollection('tracks');
collection.upsert('track-1', embedding, { title:'Blue Monday' });
```

### Public API

`createDatabase(options)`, `cosineSimilarity(a, b)`

Implementation guide: [modules/BareMetal.Vector.md](modules/BareMetal.Vector.md)

## BareMetal.VectorSearch

```html
<script src="src/BareMetal.VectorSearch.js"></script>
```

```js
const index = BareMetal.VectorSearch.createIndex({ dimensions:3 });
index.upsert('track-1', new Float32Array([0.1,0.2,0.3]));
const matches = index.topK(query, 5);
```

### Public API

`createIndex(options)`, `cosineSimilarity(a, b)`

Implementation guide: [modules/BareMetal.VectorSearch.md](modules/BareMetal.VectorSearch.md)

## BareMetal.VTTerminal

```html
<script src="src/BareMetal.VTTerminal.js"></script>
```

```js
const terminal = BareMetal.VTTerminal.create({
  element: '#terminal',
  cols: 120,
  rows: 32,
  maxLines: 5000
});

terminal.write('\u001b[32mconnected\u001b[0m\r\n');
terminal.openWebSocket('wss://host/terminal');
terminal.onInput(text => socket.send(text));
```

### Public API

`fg`, `bg`, `bold`, `dim`, `inverse`, `underline`

Implementation guide: [BareMetal.VTTerminal.md](BareMetal.VTTerminal.md)

## BareMetal.Workers

```html
<script src="src/BareMetal.Workers.js"></script>
```

```js
const hashWorker = BareMetal.Workers.create(function(input) {
  return String(input).toUpperCase();
});
```

### Public API

`create(workerFn)`, `spawn(workerFn)`, `shared(workerFn, opts)`, `pool(workerFn, opts)`, `debounce(fn, wait, opts)`, `throttle(fn, wait, opts)`, `read(fn)`, `write(fn)`, `nextFrame(fn)`, `cancelFrame(id)`, `idle(fn, opts)`, `cancelIdle(id)`, `idleQueue(tasks, opts)`, `taskQueue(opts)`, `delay(ms)`, `interval(fn, ms)`, `timeout(valueOrPromise, ms)`, `retry(fn, opts)`, `cleanup()`, `runner.run(payload, transfer)`, `runner.terminate()`, `workerHandle.send(data, transfer)`, `workerHandle.on(event, handler)`, `workerHandle.terminate()`, `sharedHandle.send(data, transfer)`, `sharedHandle.on(event, handler)`, `sharedHandle.close()`, `pool.run(data, transfer)`, `pool.runAll(items)`, `pool.map(items, fn)`, `pool.terminate()`, `pool.stats()`, `queue.add(fn, opts)`, `queue.pause()`, `queue.resume()`, `queue.clear()`, `queue.stats()`, `idleQueue.cancel()`, `interval.stop()`, `interval.restart()`

Implementation guide: [BareMetal.Workers.md](BareMetal.Workers.md)

## BareMetal.Workflow

```html
<script src="src/BareMetal.Workflow.js"></script>
```

```js
BareMetal.Workflow.create('smoke', [
  { type: 'SET', name: 'count', value: 1 }
]);
```

### Public API

`create(name, steps)`, `run(name, initialContext)`, `exec(steps, initialContext)`, `list()`, `get(name)`, `remove(name)`, `onStep(fn)`, `onError(fn)`, `onComplete(fn)`, `toJSON(name)`, `fromJSON(name, json)`, `stepTypes()`, `designer(container, workflowName)`

Implementation guide: [BareMetal.Workflow.md](BareMetal.Workflow.md)
