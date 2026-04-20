// BareMetal.ComponentFactories — object factories
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.ComponentFactories = (() => {
  'use strict';

  function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

  const create = {
    message: (text, opts) => Object.assign({ text: text || '', from: 'user', time: now() }, opts),
    botMessage: (text, opts) => Object.assign({ text: text || '', from: 'bot', time: now() }, opts),
    toast: (message, opts) => Object.assign({ message: message || '', type: 'info', duration: '5s' }, opts),
    calendarEvent: (date, label, opts) => Object.assign({ date: date || '', label: label || '' }, opts),
    ganttTask: (label, start, end, opts) => Object.assign({ label: label || '', start: start || '', end: end || '', progress: 0 }, opts),
    treeNode: (label, opts) => Object.assign({ label: label || '', children: [] }, opts),
    tableRow: (obj) => Object.assign({}, obj),
    navLink: (text, href, opts) => Object.assign({ text: text || '', href: href || '#' }, opts),
    navDropdown: (title, ...links) => [title, ...links],
    listItem: (key, data) => Object.assign({ id: key }, data)
  };

  // chatEndpoint — uses BareMetal.Communications at runtime if available
  function chatEndpoint(messagesKey, url, opts) {
    var o = Object.assign({ method: 'POST', bodyKey: 'message', responseKey: 'reply', botAvatar: '🤖', botName: 'Assistant' }, opts);
    return function(state) {
      return function(text) {
        var getPath = BareMetal.Bind ? BareMetal.Bind.getPath : function(obj, path) { return path.split('.').reduce((o,k) => o && o[k], obj); };
        var arr = getPath(state, messagesKey);
        if (!Array.isArray(arr)) return;
        arr.push(create.message(text));
        var rest = (typeof BareMetal !== 'undefined' && BareMetal.Communications) ? BareMetal.Communications : null;
        if (rest) {
          var body = {}; body[o.bodyKey] = text;
          rest.call(url, o.method, body).then(function(res) {
            var reply = (res && res[o.responseKey]) || (typeof res === 'string' ? res : JSON.stringify(res));
            arr.push(create.botMessage(reply, { avatar: o.botAvatar, name: o.botName }));
          }).catch(function(err) {
            arr.push(create.botMessage('Error: ' + (err.message || err), { avatar: '⚠️', name: 'System' }));
          });
        }
      };
    };
  }

  return { create, chatEndpoint };
})();
