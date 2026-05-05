var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Pay = (function(){
'use strict';
var g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this);
function own(o, k){ return Object.prototype.hasOwnProperty.call(o || {}, k); }
function num(v){ return Number(String(v == null ? 0 : v).replace(/[^0-9.-]/g, '')) || 0; }
function round(v){ return Math.round(num(v) * 100) / 100; }
function str(v, d){ return v == null ? (d == null ? '' : String(d)) : String(v); }
function copy(o){ var r = {}, k; for(k in (o || {})) if(own(o, k)) r[k] = o[k]; return r; }
function arr(v){ return Array.isArray(v) ? v : (v == null ? [] : [v]); }
function money(v, currency){ var out = round(v).toFixed(2); return { currency:str(currency, 'USD'), value:out === '-0.00' ? '0.00' : out }; }
function method(url, data){ var out = { supportedMethods:url }; if(data != null) out.data = Array.isArray(data) ? data.slice() : (typeof data === 'object' ? copy(data) : data); return out; }
function paymentCtor(){ return g.PaymentRequest || (typeof PaymentRequest !== 'undefined' ? PaymentRequest : null); }
function cloneAmount(a, currency){ return a && typeof a === 'object' && !Array.isArray(a) ? money(a.value, a.currency || currency) : money(a, currency); }
function detailItem(item, currency){
item = item || {};
var amount = item.amount && typeof item.amount === 'object' && !Array.isArray(item.amount) ? item.amount : { value:item.amount != null ? item.amount : item.value, currency:item.currency || currency };
var out = { label:str(item.label || item.name || item.id || 'Item'), amount:cloneAmount(amount, currency) };
if(item.pending != null) out.pending = !!item.pending;
return out;
}
function normalizeDetails(details){
var d = details && typeof details.toDetails === 'function' ? details.toDetails(details.label || 'Total') : (details || {});
var total = d.total || { label:d.label || 'Total', amount:d.amount != null ? d.amount : 0, currency:d.currency };
var currency = (total.amount && total.amount.currency) || total.currency || (d.displayItems && d.displayItems[0] && ((d.displayItems[0].amount && d.displayItems[0].amount.currency) || d.displayItems[0].currency)) || 'USD';
var out = { total:detailItem(total, currency) };
if(d.id != null) out.id = str(d.id);
if(d.displayItems && d.displayItems.length) out.displayItems = d.displayItems.map(function(it){ return detailItem(it, currency); });
if(d.shippingOptions){
if(typeof d.shippingOptions.toArray === 'function') out.shippingOptions = d.shippingOptions.toArray();
else if(Array.isArray(d.shippingOptions)) out.shippingOptions = d.shippingOptions.map(function(it){
var o = { id:str(it && it.id), label:str(it && it.label), amount:cloneAmount(it && it.amount, currency), selected:!!(it && it.selected) };
return o;
});
}
if(d.modifiers) out.modifiers = d.modifiers.slice ? d.modifiers.slice() : d.modifiers;
return out;
}
function cleanList(v){ return arr(v).map(function(x){ return str(x); }).filter(Boolean); }
function card(opts){
var o = typeof opts === 'string' ? { supportedNetworks:[opts] } : (Array.isArray(opts) ? { supportedNetworks:opts } : copy(opts || {}));
var data = {};
var nets = cleanList(o.supportedNetworks || o.networks);
var types = cleanList(o.supportedTypes || o.types);
var k;
if(nets.length) data.supportedNetworks = nets;
if(types.length) data.supportedTypes = types;
for(k in o) if(own(o, k) && k !== 'supportedNetworks' && k !== 'networks' && k !== 'supportedTypes' && k !== 'types') data[k] = o[k];
return method('basic-card', data);
}
function googlePay(config){ return method('https://google.com/pay', config || {}); }
function applePay(config){ return method('https://apple.com/apple-pay', config || {}); }
function normalizeMethod(v){
var t;
if(!v) return null;
if(typeof v === 'string'){
t = v.toLowerCase();
if(t === 'basic-card' || t === 'basiccard' || t === 'card') return card();
if(t === 'google-pay' || t === 'googlepay' || t === 'google') return googlePay();
if(t === 'apple-pay' || t === 'applepay' || t === 'apple') return applePay();
return method(v);
}
if(Array.isArray(v)) return v.map(normalizeMethod).filter(Boolean);
if(v.supportedMethods) return { supportedMethods:str(v.supportedMethods), data:v.data == null ? {} : (typeof v.data === 'object' ? copy(v.data) : v.data) };
if(own(v, 'googlePay')) return googlePay(v.googlePay);
if(own(v, 'applePay')) return applePay(v.applePay);
if(own(v, 'card')) return card(v.card);
if(own(v, 'basicCard')) return card(v.basicCard);
if(v.type || v.method){
t = str(v.type || v.method).toLowerCase();
if(t.indexOf('google') >= 0) return googlePay(v.data || v.config || v);
if(t.indexOf('apple') >= 0) return applePay(v.data || v.config || v);
if(t.indexOf('card') >= 0) return card(v.data || v.config || v);
}
return card(v);
}
function normalizeMethods(methods){
var list = arr(methods == null ? card() : methods), out = [], i, v;
for(i = 0; i < list.length; i++){
v = normalizeMethod(list[i]);
if(Array.isArray(v)) out = out.concat(v);
else if(v) out.push(v);
}
return out;
}
function canPay(){ return !!paymentCtor(); }
function request(details, methods, opts){
var PR = paymentCtor(), req;
if(!PR) return Promise.reject(new Error('Payment Request API unavailable'));
req = new PR(normalizeMethods(methods), normalizeDetails(details), copy(opts || {}));
return Promise.resolve(req.show()).then(function(res){
if(!res) return res;
try {
if(!own(res, 'request')) Object.defineProperty(res, 'request', { configurable:true, enumerable:false, writable:true, value:req });
else res.request = req;
} catch(_){ try { res.__request = req; } catch(__){} }
return res;
});
}
function formatCurrency(amount, currency, locale){
try { return new Intl.NumberFormat(locale || undefined, { style:'currency', currency:str(currency, 'USD') }).format(num(amount)); }
catch(_) { return str(currency, 'USD') + ' ' + money(amount, currency).value; }
}
function cart(seed){
var items = [];
function idx(id){ var i; id = str(id); for(i = 0; i < items.length; i++) if(items[i].id === id) return i; return -1; }
function clone(item){ return { id:item.id, label:item.label, amount:item.amount, qty:item.qty, currency:item.currency, pending:!!item.pending }; }
var api = {
add:function(item){
item = item || {};
var x = {
 id:str(item.id, 'item-' + (items.length + 1)),
 label:str(item.label || item.name, 'Item ' + (items.length + 1)),
 amount:round(item.amount != null ? item.amount : item.value),
 qty:item.qty == null ? 1 : Math.max(0, num(item.qty)),
 currency:str(item.currency, 'USD'),
 pending:!!item.pending
};
var i = idx(x.id);
if(i >= 0){
items[i].qty += x.qty;
if(item.amount != null || item.value != null) items[i].amount = x.amount;
if(item.label != null || item.name != null) items[i].label = x.label;
if(item.currency != null) items[i].currency = x.currency;
if(item.pending != null) items[i].pending = x.pending;
} else if(x.qty > 0) items.push(x);
return api;
},
remove:function(id){ var i = idx(id); if(i >= 0) items.splice(i, 1); return api; },
update:function(id, qty){ var i = idx(id), q = Math.max(0, num(qty)); if(i < 0) return api; if(!q) items.splice(i, 1); else items[i].qty = q; return api; },
clear:function(){ items.length = 0; return api; },
getTotal:function(currency){ var total = 0, i, it, c = currency == null ? '' : str(currency); for(i = 0; i < items.length; i++){ it = items[i]; if(!c || it.currency === c) total += round(it.amount) * (it.qty || 0); } return round(total); },
getItems:function(){ return items.map(clone); },
toDetails:function(label){
var cur = items[0] ? items[0].currency : 'USD';
return {
 displayItems:items.map(function(it){ return { label:it.label, amount:money(it.amount * it.qty, it.currency || cur), pending:!!it.pending }; }),
 total:{ label:str(label, 'Total'), amount:money(api.getTotal(cur), cur) }
};
}
};
arr(seed).forEach(function(it){ api.add(it); });
return api;
}
function shipping(options){
var list = [];
var base = options && !Array.isArray(options) ? options : { options:options };
var currency = str(base && base.currency, 'USD');
function setSelected(id){ var i; for(i = 0; i < list.length; i++) list[i].selected = list[i].id === id; }
function clone(it){ return { id:it.id, label:it.label, amount:money(it.amount.value, it.amount.currency), selected:!!it.selected }; }
var api = {
add:function(id, label, amount, selected){
var src = id && typeof id === 'object' && !Array.isArray(id) ? id : { id:id, label:label, amount:amount, selected:selected };
var opt = {
 id:str(src.id, 'ship-' + (list.length + 1)),
 label:str(src.label, 'Shipping'),
 amount:cloneAmount(src.amount != null ? src.amount : 0, src.currency || currency),
 selected:!!src.selected
};
if(opt.selected) setSelected(opt.id);
list.push(opt);
if(opt.selected) setSelected(opt.id);
return api;
},
getSelected:function(){ var i; for(i = 0; i < list.length; i++) if(list[i].selected) return clone(list[i]); return list[0] ? clone(list[0]) : null; },
toArray:function(){ return list.map(clone); }
};
arr(base && base.options).forEach(function(it, i){ api.add(copy(it)); if(i === 0 && !api.getSelected()) list[0].selected = true; });
if(list.length && !list.some(function(it){ return it.selected; })) list[0].selected = true;
return api;
}
function luhn(numStr){
var sum = 0, alt = false, i, n;
for(i = numStr.length - 1; i >= 0; i--){
n = num(numStr.charAt(i));
if(alt){ n *= 2; if(n > 9) n -= 9; }
sum += n;
alt = !alt;
}
return !!numStr && sum % 10 === 0;
}
function cardType(numStr){
if(/^4(?:\d{12}|\d{15}|\d{18})$/.test(numStr)) return 'Visa';
if(/^(5[1-5]\d{14}|2(?:2(?:2[1-9]\d{12}|[3-9]\d{13})|[3-6]\d{14}|7(?:0\d{13}|1\d{13}|20\d{12})))$/.test(numStr)) return 'MasterCard';
if(/^3[47]\d{13}$/.test(numStr)) return 'Amex';
if(/^(6011\d{12}|65\d{14}|64[4-9]\d{13}|622(?:12[6-9]\d{10}|1[3-9]\d{11}|[2-8]\d{12}|9(?:[01]\d{11}|2[0-5]\d{10})))$/.test(numStr)) return 'Discover';
return '';
}
function validate(cardNumber){
var digits = str(cardNumber).replace(/\D+/g, '');
var type = cardType(digits);
return { valid:!!type && luhn(digits), type:type || null };
}
function abort(response){
var req = response && (response.request || response.__request || response);
return req && typeof req.abort === 'function' ? Promise.resolve(req.abort()).then(function(){ return true; }).catch(function(){ return false; }) : Promise.resolve(false);
}
function complete(response, result){
return response && typeof response.complete === 'function' ? Promise.resolve(response.complete(result || 'unknown')) : Promise.resolve(false);
}
function retry(response, errors){
return response && typeof response.retry === 'function' ? Promise.resolve(response.retry(copy(errors || {}))) : Promise.resolve(false);
}
return {
canPay:canPay,
request:request,
card:card,
googlePay:googlePay,
applePay:applePay,
formatCurrency:formatCurrency,
cart:cart,
shipping:shipping,
validate:validate,
abort:abort,
complete:complete,
retry:retry
};
})();
if(typeof module !== 'undefined') module.exports = BareMetal.Pay;
