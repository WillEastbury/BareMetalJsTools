var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.UndoRedo = (function(){
  'use strict';
  function n(){}
  function f(v){ return typeof v === 'function'; }
  function o(v){ return !!v && typeof v === 'object'; }
  function c(v){ return v === undefined ? v : JSON.parse(JSON.stringify(v)); }
  function s(u, r){ return { canUndo: !!u.length, canRedo: !!r.length, undoName: u.length ? (u[u.length - 1].name || null) : null, redoName: r.length ? (r[r.length - 1].name || null) : null, size: u.length + r.length, index: u.length }; }
  function e(m, t, p){ var a = m[t] ? m[t].slice() : [], i; for(i = 0; i < a.length; i++) try { a[i](p); } catch(_){} }
  function m(cmd){ if(!o(cmd)) throw new Error('Invalid command'); return { name: typeof cmd.name === 'string' ? cmd.name : '', execute: f(cmd.execute) ? cmd.execute : n, undo: f(cmd.undo) ? cmd.undo : n, data: cmd.data === undefined ? null : cmd.data }; }
  function g(name, items, data){ var a = items.slice(); return { name: name || 'Group', data: data === undefined ? { group: true, count: a.length } : data, items: a, execute: function(){ var i; for(i = 0; i < a.length; i++) a[i].execute(); }, undo: function(){ var i; for(i = a.length - 1; i >= 0; i--) a[i].undo(); } }; }
  function j(cmd){ var out = { name: cmd.name || '', data: c(cmd.data) }, i; if(cmd.items && cmd.items.length){ out.items = []; for(i = 0; i < cmd.items.length; i++) out.items.push(j(cmd.items[i])); } return out; }
  function r(raw){ var i, a = []; if(raw && raw.items && raw.items.length){ for(i = 0; i < raw.items.length; i++) a.push(r(raw.items[i])); return g(raw.name, a, raw.data); } return { name: raw && typeof raw.name === 'string' ? raw.name : '', data: raw && raw.data !== undefined ? raw.data : null, execute: n, undo: n }; }
  function create(x){
    var p = o(x) ? x : {}, h = p.maxSize > 0 ? p.maxSize : 0, u = [], y = [], k = [], v = {}, b = { canUndo: false, canRedo: false }, api;
    function q(){ var t = s(u, y); if(f(p.onChange)) try { p.onChange(t); } catch(_){} if(t.canUndo !== b.canUndo && f(p.onCanUndoChange)) try { p.onCanUndoChange(t.canUndo); } catch(_){} if(t.canRedo !== b.canRedo && f(p.onCanRedoChange)) try { p.onCanRedoChange(t.canRedo); } catch(_){} b.canUndo = t.canUndo; b.canRedo = t.canRedo; return t; }
    function z(){ while(h && u.length > h) u.shift(); }
    function w(cmd){ if(k.length){ k[k.length - 1].items.push(cmd); return cmd; } y.length = 0; u.push(cmd); z(); e(v, 'push', cmd); q(); return cmd; }
    function G(){ var a = k.pop(), cmd; if(!a) return false; if(!a.items.length){ if(!k.length) q(); return true; } cmd = g(a.name, a.items, a.data); if(k.length){ k[k.length - 1].items.push(cmd); return true; } y.length = 0; u.push(cmd); z(); e(v, 'push', cmd); q(); return true; }
    function U(){ var cmd; if(!u.length) return false; cmd = u.pop(); cmd.undo(); y.push(cmd); e(v, 'undo', cmd); q(); return true; }
    function R(){ var cmd; if(!y.length) return false; cmd = y.pop(); cmd.execute(); u.push(cmd); z(); e(v, 'redo', cmd); q(); return true; }
    api = { push: function(cmd){ return w(m(cmd)); }, exec: function(cmd){ cmd = m(cmd); cmd.execute(); return w(cmd); }, undo: U, redo: R, canUndo: function(){ return !!u.length; }, canRedo: function(){ return !!y.length; }, undoName: function(){ return u.length ? (u[u.length - 1].name || null) : null; }, redoName: function(){ return y.length ? (y[y.length - 1].name || null) : null; }, size: function(){ return u.length + y.length; }, index: function(){ return u.length; }, beginGroup: function(name, data){ k.push({ name: name || 'Group', data: data, items: [] }); return api; }, endGroup: G, group: function(name, fn, data){ api.beginGroup(name, data); try { if(f(fn)) fn(); } finally { G(); } return api; }, toJSON: function(){ return JSON.stringify({ undo: u.map(j), redo: y.map(j) }); }, fromJSON: function(json){ var d = typeof json === 'string' ? JSON.parse(json) : (json || {}), i; u.length = 0; y.length = 0; k.length = 0; for(i = 0; i < ((d.undo && d.undo.length) || 0); i++) u.push(r(d.undo[i])); for(i = 0; i < ((d.redo && d.redo.length) || 0); i++) y.push(r(d.redo[i])); z(); q(); return api; }, clear: function(){ u.length = 0; y.length = 0; k.length = 0; e(v, 'clear'); q(); return api; }, clearRedo: function(){ if(y.length){ y.length = 0; q(); } return api; }, checkpoint: function(){ return u.length; }, revertTo: function(point){ if(typeof point !== 'number' || point < 0 || point > u.length) return false; while(u.length > point) U(); return true; }, bindKeys: function(el){ var t = el || (typeof document !== 'undefined' && document); function H(ev){ var mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || ''), key = (ev.key || '').toLowerCase(), mod = mac ? ev.metaKey : ev.ctrlKey; if(!mod || ev.altKey) return; if(key === 'z' && ev.shiftKey){ ev.preventDefault(); R(); return; } if(key === 'y'){ ev.preventDefault(); R(); return; } if(key === 'z'){ ev.preventDefault(); U(); } } if(!t || !t.addEventListener) return n; t.addEventListener('keydown', H); return function(){ t.removeEventListener('keydown', H); }; }, on: function(name, fn){ if(!f(fn)) return api; (v[name] = v[name] || []).push(fn); return api; }, off: function(name, fn){ var a = v[name], i; if(!a) return api; if(!fn){ delete v[name]; return api; } i = a.indexOf(fn); if(i >= 0) a.splice(i, 1); return api; } };
    return api;
  }
  function createSnap(x){
    var p = o(x) ? x : {}, h = p.maxSize > 0 ? p.maxSize : 0, a = [], i = -1;
    function cur(){ return i >= 0 ? c(a[i]) : null; }
    function q(){ var t = { current: cur(), canUndo: i > 0, canRedo: i >= 0 && i < a.length - 1, size: a.length, index: i }; if(f(p.onChange)) try { p.onChange(t); } catch(_){} return t.current; }
    return { snapshot: function(v){ if(i < a.length - 1) a = a.slice(0, i + 1); a.push(c(v)); if(h && a.length > h) a.shift(); i = a.length - 1; q(); return cur(); }, undo: function(){ if(i <= 0) return null; i--; q(); return cur(); }, redo: function(){ if(i < 0 || i >= a.length - 1) return null; i++; q(); return cur(); }, current: cur };
  }
  return { create: create, createSnap: createSnap };
})();
if(typeof module!=='undefined') module.exports = BareMetal.UndoRedo;
