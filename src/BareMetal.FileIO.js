var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.FileIO = (function(){
'use strict';
var g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this);
var mm = {
'image/*':['.png','.jpg','.jpeg','.gif','.webp','.bmp','.svg','.ico'],
'video/*':['.mp4','.webm','.mov','.avi','.mkv'],
'audio/*':['.mp3','.wav','.ogg','.m4a','.aac','.flac'],
'application/pdf':['.pdf'],'application/json':['.json'],'text/plain':['.txt']
};
function d(){ return g.document || null; }
function a(v){ return Array.prototype.slice.call(v || []); }
function c(fn){ if(typeof fn !== 'function') return; try { return fn.apply(null, a(arguments).slice(1)); } catch(_){} }
function ext(name){ name = String(name || ''); var i = name.lastIndexOf('.'); return i < 0 ? '' : name.slice(i + 1).toLowerCase(); }
function typeOf(f){ return String(f && f.type || '').toLowerCase(); }
function nameOf(f){ return String(f && f.name || ''); }
function isType(f, p, xs){ var t = typeOf(f), x = ext(nameOf(f)), i; if(p && t.indexOf(p) === 0) return true; for(i = 0; xs && i < xs.length; i++) if(x === xs[i]) return true; return false; }
function formatSize(bytes){ var n = Number(bytes) || 0, u = ['B','KB','MB','GB','TB'], i = 0, s; while(n >= 1024 && i < u.length - 1){ n /= 1024; i++; } s = i ? ((n >= 10 || Math.round(n) === n) ? n.toFixed(0) : n.toFixed(1)) : String(Math.round(n)); return s + ' ' + u[i]; }
function ok(file, rules){ var t = typeOf(file), x = '.' + ext(nameOf(file)), i, r, p; if(!rules || !rules.length) return true; for(i = 0; i < rules.length; i++){ r = String(rules[i] || '').toLowerCase(); if(!r) continue; if(r.charAt(0) === '.' && x === r) return true; if(r.slice(-2) === '/*'){ p = r.slice(0, -1); if(t.indexOf(p) === 0) return true; } if(t === r) return true; } return false; }
function types(opts){ var rs = opts && opts.accept, ac = {}, i, r, ex; if(!rs || !rs.length) return; for(i = 0; i < rs.length; i++){ r = String(rs[i] || '').toLowerCase(); if(!r) continue; if(r.charAt(0) === '.'){ (ac['*/*'] = ac['*/*'] || []).push(r); } else if((ex = mm[r])) ac[r] = ex.slice(); }
return Object.keys(ac).length ? [{ description: opts && opts.description || 'Files', accept: ac }] : undefined;
}
function pickBase(opts, dir){
return new Promise(function(resolve){
var o = opts || {}, w = g.window || g, x, done = false, timer, body, input = d() && d().createElement ? d().createElement('input') : null;
function fin(v){ if(done) return; done = true; if(timer) clearTimeout(timer); try { if(w && w.removeEventListener) w.removeEventListener('focus', onFocus); } catch(_){} try { if(input && input.parentNode) input.parentNode.removeChild(input); } catch(_){} resolve(v || []); }
function onFocus(){ timer = setTimeout(function(){ fin([]); }, 250); }
if(!input) return resolve([]);
input.type = 'file';
if(o.multiple || dir) input.multiple = true;
if(o.accept && o.accept.length) input.accept = o.accept.join(',');
if(dir){ input.setAttribute('webkitdirectory', ''); input.webkitdirectory = true; }
input.style.position = 'fixed'; input.style.left = '-9999px'; input.style.top = '-9999px';
input.addEventListener('change', function(){
x = a(input.files);
fin(dir ? x.map(function(f){ return { name:f.name, path:f.webkitRelativePath || f.name, file:f }; }) : x);
});
body = d().body || d().documentElement; if(body) body.appendChild(input);
try { if(w && w.addEventListener) w.addEventListener('focus', onFocus); input.click(); } catch(_) { fin([]); }
});
}
function pick(opts){ return pickBase(opts, false); }
function read(method, blob, enc){
return new Promise(function(resolve){
var R = g.FileReader, fr;
if(!blob || !R) return resolve(null);
try { fr = new R(); fr.onload = function(){ resolve(fr.result); }; fr.onerror = fr.onabort = function(){ resolve(null); }; method === 'readAsText' ? fr.readAsText(blob, enc || 'utf-8') : fr[method](blob); } catch(_) { resolve(null); }
});
}
function readAsText(file, enc){ return read('readAsText', file, enc); }
function readAsArrayBuffer(file){ return read('readAsArrayBuffer', file); }
function readAsDataURL(file){ return read('readAsDataURL', file); }
function readAsJSON(file){ return readAsText(file).then(function(text){ if(text === null) return null; try { return JSON.parse(text); } catch(_) { return null; } }); }
function blobToArrayBuffer(blob){ return blob && blob.arrayBuffer ? blob.arrayBuffer().catch(function(){ return null; }) : readAsArrayBuffer(blob); }
function blobToText(blob){ return blob && blob.text ? blob.text().catch(function(){ return null; }) : readAsText(blob); }
function blobToDataURL(blob){ return readAsDataURL(blob); }
function textToBlob(text, type){ return new Blob([text == null ? '' : String(text)], { type:type || 'text/plain' }); }
function arrayBufferToBlob(buf, type){ return new Blob([buf || new ArrayBuffer(0)], { type:type || 'application/octet-stream' }); }
function asBlob(v, type){ if(v instanceof Blob) return v; if(typeof ArrayBuffer !== 'undefined' && v instanceof ArrayBuffer) return arrayBufferToBlob(v, type); if(typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(v)) return new Blob([v], { type:type || 'application/octet-stream' }); if(v && typeof v === 'object') return textToBlob(JSON.stringify(v, null, 2), type || 'application/json'); return textToBlob(v == null ? '' : String(v), type || 'text/plain'); }
function one(v){ return v && v.length !== undefined && !v.name ? v[0] : v; }
function open(opts){
var m = !!(opts && opts.multiple);
if(g.showOpenFilePicker) return g.showOpenFilePicker({ multiple:m, types:types(opts), excludeAcceptAllOption:false }).then(function(hs){ return Promise.all((hs || []).map(function(h){ return h.getFile(); })); }).then(function(fs){ return m ? fs : (fs[0] || null); }).catch(function(){ return m ? [] : null; });
return pick(opts).then(function(fs){ return m ? fs : (fs[0] || null); }).catch(function(){ return m ? [] : null; });
}
function openRead(opts, mode){
return open(opts).then(function(f){
f = one(f); if(!f) return null;
if(mode === 'text') return readAsText(f).then(function(v){ return v === null ? null : { name:f.name, text:v, size:f.size, type:f.type || '' }; });
if(mode === 'json') return readAsJSON(f).then(function(v){ return v === null ? null : { name:f.name, data:v, size:f.size }; });
if(mode === 'bin') return readAsArrayBuffer(f).then(function(v){ return v === null ? null : { name:f.name, buffer:v, size:f.size, type:f.type || '' }; });
return readAsDataURL(f).then(function(v){ return v === null ? null : { name:f.name, dataUrl:v, size:f.size, type:f.type || '' }; });
}).catch(function(){ return null; });
}
async function openDirectory(){
var out = [];
async function walk(h, base){ var e, f; for await (e of h.values()){ if(e.kind === 'file'){ f = await e.getFile(); out.push({ name:f.name, path:base ? base + '/' + f.name : f.name, file:f }); } else if(e.kind === 'directory') await walk(e, base ? base + '/' + e.name : e.name); } }
try { if(g.showDirectoryPicker){ await walk(await g.showDirectoryPicker(), ''); return out; } return await pickBase({ multiple:true }, true); } catch(_) { return []; }
}
function clickHref(href, name){ var q = d() && d().createElement ? d().createElement('a') : null, b; if(!q) return; q.href = href; q.download = name || 'download'; q.style.display = 'none'; b = d().body || d().documentElement; b.appendChild(q); if(q.click) q.click(); if(q.parentNode) q.parentNode.removeChild(q); }
function download(content, filename, type){ var u = g.URL || (g.window && g.window.URL), href = ''; try { href = u && u.createObjectURL ? u.createObjectURL(asBlob(content, type)) : ''; clickHref(href || 'data:application/octet-stream,', filename); if(href && u && u.revokeObjectURL) setTimeout(function(){ try { u.revokeObjectURL(href); } catch(_){} }, 50); } catch(_){} }
function downloadUrl(url, filename){ if(!url) return Promise.resolve(); if(g.fetch && filename) return g.fetch(url).then(function(r){ return r && r.blob ? r.blob() : null; }).then(function(b){ if(b) download(b, filename, b.type); else clickHref(url, filename); }).catch(function(){}); try { clickHref(url, filename); } catch(_){} return Promise.resolve(); }
async function save(content, opts){ var o = opts || {}, blob = asBlob(content, o.type), h, w; try { if(g.showSaveFilePicker){ h = await g.showSaveFilePicker({ suggestedName:o.filename || 'download', types:types(o) }); w = await h.createWritable(); await w.write(blob); await w.close(); return true; } download(blob, o.filename || 'download', blob.type || o.type); return true; } catch(_) { return false; } }
async function readChunked(file, opts){ var o = opts || {}, z = o.chunkSize || 65536, size = file && file.size || 0, off = 0, chunk; try { while(off < size){ chunk = await readAsArrayBuffer(file.slice(off, off + z)); if(chunk === null) break; c(o.onChunk, chunk, off, size); off += chunk.byteLength || z; c(o.onProgress, size ? Math.min(100, Math.round(off / size * 100)) : 100); } c(o.onComplete); } catch(_){} }
function dropZone(el, opts){
var o = opts || {}, n = 0;
if(!el || !el.addEventListener) return { destroy:function(){} };
function stop(e){ if(e && e.preventDefault) e.preventDefault(); if(e && e.stopPropagation) e.stopPropagation(); }
function hi(on){ if(o.highlight !== false && el.classList) el.classList[on ? 'add' : 'remove']('bm-drop-active'); }
function leave(){ if(n <= 0){ n = 0; hi(false); c(o.onDragLeave); } }
function enter(e){ stop(e); n++; hi(true); c(o.onDragOver, e); }
function over(e){ stop(e); hi(true); c(o.onDragOver, e); }
function out(e){ stop(e); n--; leave(); }
function drop(e){
var fs;
stop(e); n = 0; hi(false);
fs = a(e && e.dataTransfer && e.dataTransfer.files).filter(function(f){ return ok(f, o.accept); });
if(!o.multiple && fs.length > 1) fs = fs.slice(0, 1);
if(!o.readAs) return c(o.onDrop, fs, e);
Promise.all(fs.map(function(f){ return o.readAs === 'text' ? readAsText(f) : o.readAs === 'binary' ? readAsArrayBuffer(f) : o.readAs === 'dataurl' ? readAsDataURL(f) : null; })).then(function(data){ c(o.onDrop, fs, data, e); }).catch(function(){ c(o.onDrop, fs, null, e); });
}
el.addEventListener('dragenter', enter); el.addEventListener('dragover', over); el.addEventListener('dragleave', out); el.addEventListener('drop', drop);
return { destroy:function(){ hi(false); el.removeEventListener('dragenter', enter); el.removeEventListener('dragover', over); el.removeEventListener('dragleave', out); el.removeEventListener('drop', drop); } };
}
function slice(file, start, end){ try { return file && file.slice ? file.slice(start, end) : null; } catch(_) { return null; } }
function stream(file){ try { return file && typeof file.stream === 'function' ? file.stream() : null; } catch(_) { return null; } }
function hasFileSystemAccess(){ return !!(g && g.showOpenFilePicker && g.showSaveFilePicker); }
function hasDragDrop(){ var q = d() && d().createElement ? d().createElement('div') : null; return !!q && ('draggable' in q || ('ondragover' in q && 'ondrop' in q)); }
return {
open:open, openText:function(opts){ return openRead(opts, 'text'); }, openJSON:function(opts){ return openRead(opts, 'json'); }, openBinary:function(opts){ return openRead(opts, 'bin'); }, openDataURL:function(opts){ return openRead(opts, 'dataurl'); }, openDirectory:openDirectory,
save:save, download:download, downloadUrl:downloadUrl,
dropZone:dropZone,
readAsText:readAsText, readAsJSON:readAsJSON, readAsArrayBuffer:readAsArrayBuffer, readAsDataURL:readAsDataURL, readChunked:readChunked, stream:stream,
pick:pick,
formatSize:formatSize, ext:ext, isImage:function(f){ return isType(f, 'image/', ['png','jpg','jpeg','gif','webp','bmp','svg','ico']); }, isVideo:function(f){ return isType(f, 'video/', ['mp4','webm','mov','avi','mkv']); }, isAudio:function(f){ return isType(f, 'audio/', ['mp3','wav','ogg','m4a','aac','flac']); }, isPDF:function(f){ return typeOf(f) === 'application/pdf' || ext(nameOf(f)) === 'pdf'; },
slice:slice,
blobToArrayBuffer:blobToArrayBuffer, blobToText:blobToText, blobToDataURL:blobToDataURL, textToBlob:textToBlob, arrayBufferToBlob:arrayBufferToBlob,
hasFileSystemAccess:hasFileSystemAccess, hasDragDrop:hasDragDrop
};
})();
if(typeof module!=='undefined') module.exports = BareMetal.FileIO;