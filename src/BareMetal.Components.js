// BareMetal.Components — widget directives (depends on BareMetal.Bind)
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Components = (() => {
  'use strict';
  const { getPath, topKey, resolveBinding, resolveInScope, parsePairs, el } = BareMetal.Bind;

  function bindComponents(root, state, watch) {

    // m-img (reactive src + lazy loading + fallback)
    root.querySelectorAll('[m-img]').forEach(n => {
      const path = n.getAttribute('m-img'), wk = topKey(path);
      const fallback = n.getAttribute('m-img-fallback') || '';
      const lazy = n.hasAttribute('m-img-lazy');
      const tag = n.tagName;
      function applySrc(src) {
        const url = src || fallback;
        if (tag === 'IMG') {
          n.src = url || '';
          if (!url) n.removeAttribute('src');
        } else {
          n.style.backgroundImage = url ? 'url(' + url + ')' : '';
        }
      }
      function onError() {
        if (fallback && n.src !== fallback) n.src = fallback;
      }
      if (tag === 'IMG') {
        if (fallback) n.addEventListener('error', onError);
        if (lazy && typeof IntersectionObserver !== 'undefined') {
          n.setAttribute('loading', 'lazy');
          let revealed = false;
          const obs = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting) { revealed = true; applySrc(getPath(state, path)); obs.disconnect(); }
          }, { rootMargin: '200px' });
          obs.observe(n);
          const sync = () => { if (revealed) applySrc(getPath(state, path)); };
          sync(); watch(wk, sync);
          return;
        }
      }
      const sync = () => applySrc(getPath(state, path));
      sync(); watch(wk, sync);
    });

    // m-navbar
    root.querySelectorAll('[m-navbar]').forEach(n => {
      const k = n.getAttribute('m-navbar'), wk = topKey(k);
      const mkLink = link => {
        const a = document.createElement('a');
        a.href = link.href || '#';
        a.textContent = link.text || '';
        if (link.active) a.classList.add('act');
        return a;
      };
      const render = () => {
        n.innerHTML = '';
        const arr = getPath(state, k);
        if (!Array.isArray(arr)) return;
        arr.forEach(item => {
          if (Array.isArray(item)) {
            const dd = el('div', 'dd');
            const btn = el('button', 'dd-t');
            btn.textContent = item[0] || '';
            dd.appendChild(btn);
            const menu = el('div', 'dd-m');
            for (let i = 1; i < item.length; i++) menu.appendChild(mkLink(item[i]));
            dd.appendChild(menu);
            n.appendChild(dd);
          } else {
            n.appendChild(mkLink(item));
          }
        });
      };
      render(); watch(wk, render);
    });

    // m-chatbot (message array → chat UI)
    root.querySelectorAll('[m-chatbot]').forEach(n => {
      const arrKey = n.getAttribute('m-chatbot'), wk = topKey(arrKey);
      const sendFn = n.getAttribute('m-chatbot-send') || '';
      const placeholder = n.getAttribute('m-chatbot-placeholder') || 'Type a message…';
      const textField = n.getAttribute('m-chatbot-text') || 'text';
      const fromField = n.getAttribute('m-chatbot-from') || 'from';
      n.classList.add('bm-chat');
      var log = el('div', 'bm-chat-log');
      var form = el('form', 'bm-chat-input');
      var input = el('input', 'bm-chat-field');
      input.type = 'text'; input.placeholder = placeholder;
      var btn = el('button', 'bm-chat-send');
      btn.type = 'submit'; btn.textContent = '➤';
      form.appendChild(input); form.appendChild(btn);
      n.appendChild(log); n.appendChild(form);
      var lastLen = 0;
      function renderMsg(msg) {
        var m = typeof msg === 'string' ? { text: msg, from: 'user' } : msg;
        var isBot = (m[fromField] || '') !== 'user';
        var bubble = el('div', 'bm-chat-bubble' + (isBot ? ' bm-chat-bot' : ' bm-chat-user'));
        if (m.avatar) {
          var av = el('span', 'bm-chat-avatar');
          av.textContent = m.avatar;
          bubble.appendChild(av);
        }
        var body = el('div', 'bm-chat-body');
        if (m.name) {
          var nm = el('div', 'bm-chat-name');
          nm.textContent = m.name;
          body.appendChild(nm);
        }
        var txt = el('div', 'bm-chat-text');
        txt.textContent = m[textField] || '';
        body.appendChild(txt);
        if (m.time) {
          var tm = el('div', 'bm-chat-time');
          tm.textContent = m.time;
          body.appendChild(tm);
        }
        bubble.appendChild(body);
        log.appendChild(bubble);
        log.scrollTop = log.scrollHeight;
      }
      function sync() {
        var arr = getPath(state, arrKey);
        if (!Array.isArray(arr)) return;
        while (lastLen < arr.length) { renderMsg(arr[lastLen]); lastLen++; }
        if (arr.length < lastLen) {
          log.innerHTML = ''; lastLen = 0;
          arr.forEach(function(m) { renderMsg(m); lastLen++; });
        }
      }
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var val = input.value.trim();
        if (!val) return;
        input.value = '';
        if (sendFn && typeof state[sendFn] === 'function') {
          state[sendFn](val);
        } else {
          var arr = getPath(state, arrKey);
          if (Array.isArray(arr)) arr.push({ text: val, from: 'user' });
        }
      });
      sync(); watch(wk, sync);
    });

    // m-calendar (month grid with events)
    root.querySelectorAll('[m-calendar]').forEach(n => {
      const arrKey = n.getAttribute('m-calendar'), wk = topKey(arrKey);
      const selectFn = n.getAttribute('m-calendar-select') || '';
      const dateField = n.getAttribute('m-calendar-date') || 'date';
      const labelField = n.getAttribute('m-calendar-label') || 'label';
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      var viewYear = new Date().getFullYear(), viewMonth = new Date().getMonth();
      function pad(n) { return n < 10 ? '0' + n : '' + n; }
      function render() {
        var arr = getPath(state, arrKey);
        if (!Array.isArray(arr)) arr = [];
        n.innerHTML = '';
        n.classList.add('bm-calendar');
        var evMap = {};
        arr.forEach(function(ev) {
          var d = ev[dateField];
          if (!d) return;
          var key = d.substring(0, 10);
          if (!evMap[key]) evMap[key] = [];
          evMap[key].push(ev);
        });
        // Header: ◀ Month Year ▶
        var header = el('div', 'bm-cal-header');
        var prev = el('button', 'bm-cal-nav');
        prev.textContent = '◀';
        prev.addEventListener('click', function() {
          viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
          render();
        });
        var next = el('button', 'bm-cal-nav');
        next.textContent = '▶';
        next.addEventListener('click', function() {
          viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
          render();
        });
        var title = el('span', 'bm-cal-title');
        title.textContent = months[viewMonth] + ' ' + viewYear;
        header.appendChild(prev);
        header.appendChild(title);
        header.appendChild(next);
        n.appendChild(header);
        // Day-of-week header
        var dowRow = el('div', 'bm-cal-row bm-cal-dow');
        days.forEach(function(d) {
          var cell = el('div', 'bm-cal-cell bm-cal-dow-cell');
          cell.textContent = d;
          dowRow.appendChild(cell);
        });
        n.appendChild(dowRow);
        // Calendar grid
        var first = new Date(viewYear, viewMonth, 1);
        var startDay = first.getDay();
        var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        var today = new Date();
        var todayStr = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
        var row = el('div', 'bm-cal-row');
        for (var b = 0; b < startDay; b++) {
          row.appendChild(el('div', 'bm-cal-cell bm-cal-empty'));
        }
        for (var d = 1; d <= daysInMonth; d++) {
          var dateStr = viewYear + '-' + pad(viewMonth + 1) + '-' + pad(d);
          var cell = el('div', 'bm-cal-cell bm-cal-day');
          if (dateStr === todayStr) cell.classList.add('bm-cal-today');
          var num = el('span', 'bm-cal-num');
          num.textContent = d;
          cell.appendChild(num);
          var cellEvents = evMap[dateStr];
          if (cellEvents) {
            cell.classList.add('bm-cal-has-events');
            var dots = el('div', 'bm-cal-dots');
            cellEvents.forEach(function(ev, i) {
              if (i >= 3) return;
              var dot = el('span', 'bm-cal-dot');
              if (ev.color) dot.style.background = ev.color;
              dot.title = ev[labelField] || '';
              dots.appendChild(dot);
            });
            if (cellEvents.length > 3) {
              var more = el('span', 'bm-cal-more');
              more.textContent = '+' + (cellEvents.length - 3);
              dots.appendChild(more);
            }
            cell.appendChild(dots);
          }
          (function(ds, evts) {
            cell.addEventListener('click', function(e) {
              var prev = n.querySelector('.bm-cal-selected');
              if (prev) prev.classList.remove('bm-cal-selected');
              cell.classList.add('bm-cal-selected');
              if (selectFn && typeof state[selectFn] === 'function') state[selectFn](ds, evts || [], e);
            });
          })(dateStr, cellEvents);
          row.appendChild(cell);
          if ((startDay + d) % 7 === 0) {
            n.appendChild(row);
            row = el('div', 'bm-cal-row');
          }
        }
        var remaining = (startDay + daysInMonth) % 7;
        if (remaining > 0) {
          for (var t = remaining; t < 7; t++) {
            row.appendChild(el('div', 'bm-cal-cell bm-cal-empty'));
          }
          n.appendChild(row);
        }
      }
      render(); watch(wk, render);
    });

    // m-gantt (array → timeline Gantt chart)
    root.querySelectorAll('[m-gantt]').forEach(n => {
      const arrKey = n.getAttribute('m-gantt'), wk = topKey(arrKey);
      const labelField = n.getAttribute('m-gantt-label') || 'label';
      const startField = n.getAttribute('m-gantt-start') || 'start';
      const endField = n.getAttribute('m-gantt-end') || 'end';
      const groupField = n.getAttribute('m-gantt-group') || 'group';
      const rowH = 32, headerH = 40, padL = 180, padR = 20;
      function toDay(s) { return Math.floor(new Date(s).getTime() / 864e5); }
      function svgEl(tag) { return document.createElementNS('http://www.w3.org/2000/svg', tag); }
      function render() {
        var arr = getPath(state, arrKey);
        n.innerHTML = '';
        n.classList.add('bm-gantt');
        if (!Array.isArray(arr) || arr.length === 0) return;
        var minD = Infinity, maxD = -Infinity;
        arr.forEach(function(t) {
          var s = toDay(t[startField]), e = toDay(t[endField]);
          if (s < minD) minD = s;
          if (e > maxD) maxD = e;
        });
        var span = maxD - minD || 1;
        var groups = [], groupMap = {}, ordered = [];
        arr.forEach(function(t) {
          var g = t[groupField] || '';
          if (g && !groupMap[g]) { groupMap[g] = true; groups.push(g); }
        });
        groups.forEach(function(g) {
          ordered.push({ _groupHeader: g });
          arr.forEach(function(t) { if ((t[groupField] || '') === g) ordered.push(t); });
        });
        arr.forEach(function(t) { if (!(t[groupField] || '')) ordered.push(t); });
        var totalH = headerH + ordered.length * rowH + 4;
        var chartW = Math.max(n.clientWidth || 600, 400);
        var barArea = chartW - padL - padR;
        var svg = svgEl('svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('viewBox', '0 0 ' + chartW + ' ' + totalH);
        svg.style.fontFamily = 'system-ui,sans-serif';
        svg.style.fontSize = '12px';
        // Header month markers
        var d0 = new Date(minD * 864e5), dEnd = new Date(maxD * 864e5);
        var cur = new Date(d0.getFullYear(), d0.getMonth(), 1);
        while (cur <= dEnd) {
          var dx = toDay(cur) - minD;
          var x = padL + (dx / span) * barArea;
          if (x >= padL) {
            var line = svgEl('line');
            line.setAttribute('x1', x); line.setAttribute('x2', x);
            line.setAttribute('y1', headerH); line.setAttribute('y2', totalH);
            line.setAttribute('stroke', '#dee2e6'); line.setAttribute('stroke-dasharray', '3,3');
            svg.appendChild(line);
            var txt = svgEl('text');
            txt.setAttribute('x', x + 4); txt.setAttribute('y', headerH - 8);
            txt.setAttribute('fill', '#6c757d'); txt.setAttribute('font-size', '11');
            var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            txt.textContent = months[cur.getMonth()] + ' ' + cur.getFullYear();
            svg.appendChild(txt);
          }
          cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        }
        // Rows
        ordered.forEach(function(item, i) {
          var y = headerH + i * rowH;
          if (i % 2 === 0) {
            var bg = svgEl('rect');
            bg.setAttribute('x', 0); bg.setAttribute('y', y);
            bg.setAttribute('width', chartW); bg.setAttribute('height', rowH);
            bg.setAttribute('fill', '#f8f9fa');
            svg.appendChild(bg);
          }
          if (item._groupHeader) {
            var gt = svgEl('text');
            gt.setAttribute('x', 8); gt.setAttribute('y', y + rowH * 0.65);
            gt.setAttribute('font-weight', '700'); gt.setAttribute('fill', '#212529');
            gt.textContent = item._groupHeader;
            svg.appendChild(gt);
            return;
          }
          var lbl = svgEl('text');
          lbl.setAttribute('x', 12); lbl.setAttribute('y', y + rowH * 0.65);
          lbl.setAttribute('fill', '#495057');
          var labelText = item[labelField] || '';
          if (labelText.length > 22) labelText = labelText.substring(0, 20) + '…';
          lbl.textContent = labelText;
          svg.appendChild(lbl);
          var s = toDay(item[startField]) - minD, e = toDay(item[endField]) - minD;
          var bx = padL + (s / span) * barArea;
          var bw = Math.max(((e - s) / span) * barArea, 4);
          var by = y + 6, bh = rowH - 12;
          var color = item.color || 'var(--bs-primary, #0d6efd)';
          var bar = svgEl('rect');
          bar.setAttribute('x', bx); bar.setAttribute('y', by);
          bar.setAttribute('width', bw); bar.setAttribute('height', bh);
          bar.setAttribute('rx', 3); bar.setAttribute('fill', color);
          bar.setAttribute('opacity', '0.25');
          svg.appendChild(bar);
          var prog = item.progress != null ? item.progress : 1;
          if (prog > 0) {
            var pbar = svgEl('rect');
            pbar.setAttribute('x', bx); pbar.setAttribute('y', by);
            pbar.setAttribute('width', bw * Math.min(prog, 1)); pbar.setAttribute('height', bh);
            pbar.setAttribute('rx', 3); pbar.setAttribute('fill', color);
            svg.appendChild(pbar);
          }
          if (s === e) {
            bar.setAttribute('width', 0);
            var dia = svgEl('polygon');
            var cx = bx, cy = by + bh / 2, r = bh / 2;
            dia.setAttribute('points', cx + ',' + (cy - r) + ' ' + (cx + r) + ',' + cy + ' ' + cx + ',' + (cy + r) + ' ' + (cx - r) + ',' + cy);
            dia.setAttribute('fill', color);
            svg.appendChild(dia);
          }
          var title = svgEl('title');
          title.textContent = (item[labelField] || '') + '\n' + item[startField] + ' → ' + item[endField] +
            (prog != null && prog < 1 ? '\nProgress: ' + Math.round(prog * 100) + '%' : '');
          bar.appendChild(title.cloneNode(true));
          if (prog > 0 && pbar) pbar.appendChild(title);
        });
        n.appendChild(svg);
      }
      render(); watch(wk, render);
    });

    // m-table (array of objects → sortable table)
    root.querySelectorAll('[m-table]').forEach(n => {
      const arrKey = n.getAttribute('m-table'), wk = topKey(arrKey);
      const selectFn = n.getAttribute('m-table-select') || '';
      const colsDef = n.getAttribute('m-table-cols') || '';
      const sortable = !n.hasAttribute('m-table-nosort');
      let sortCol = null, sortAsc = true, selectedRow = null;
      function parseCol(s) {
        var i = s.indexOf(':');
        if (i > -1) return { header: s.substring(0, i).trim(), key: s.substring(i + 1).trim() };
        s = s.trim();
        return { header: s.charAt(0).toUpperCase() + s.slice(1), key: s };
      }
      function render() {
        var arr = getPath(state, arrKey);
        n.innerHTML = '';
        selectedRow = null;
        if (!Array.isArray(arr) || arr.length === 0) return;
        var cols = colsDef
          ? colsDef.split(',').map(parseCol)
          : Object.keys(arr[0]).map(function(k) { return { header: k.charAt(0).toUpperCase() + k.slice(1), key: k }; });
        var data = arr.slice();
        if (sortCol !== null) {
          var key = cols[sortCol].key;
          data.sort(function(a, b) {
            var va = a[key], vb = b[key];
            if (va == null) va = '';
            if (vb == null) vb = '';
            if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va;
            va = String(va).toLowerCase(); vb = String(vb).toLowerCase();
            return sortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
          });
        }
        var thead = document.createElement('thead');
        var hrow = document.createElement('tr');
        cols.forEach(function(col, ci) {
          var th = document.createElement('th');
          th.textContent = col.header;
          th.className = 'bm-table-th';
          if (sortable) {
            th.style.cursor = 'pointer';
            if (sortCol === ci) th.textContent += sortAsc ? ' ▲' : ' ▼';
            th.addEventListener('click', function() {
              if (sortCol === ci) sortAsc = !sortAsc; else { sortCol = ci; sortAsc = true; }
              render();
            });
          }
          hrow.appendChild(th);
        });
        thead.appendChild(hrow);
        n.appendChild(thead);
        var tbody = document.createElement('tbody');
        data.forEach(function(item) {
          var tr = document.createElement('tr');
          tr.className = 'bm-table-row';
          cols.forEach(function(col) {
            var td = document.createElement('td');
            var val = item[col.key];
            td.textContent = val != null ? val : '';
            tr.appendChild(td);
          });
          tr.addEventListener('click', function(e) {
            if (selectedRow) selectedRow.classList.remove('bm-table-selected');
            tr.classList.add('bm-table-selected');
            selectedRow = tr;
            if (selectFn && typeof state[selectFn] === 'function') state[selectFn](item, e);
          });
          tbody.appendChild(tr);
        });
        n.appendChild(tbody);
        n.classList.add('bm-table');
      }
      render(); watch(wk, render);
    });

    // m-tree (recursive collapsible treeview)
    root.querySelectorAll('[m-tree]').forEach(n => {
      const arrKey = n.getAttribute('m-tree'), wk = topKey(arrKey);
      const selectFn = n.getAttribute('m-tree-select') || '';
      const labelField = n.getAttribute('m-tree-label') || 'label';
      const childField = n.getAttribute('m-tree-children') || 'children';
      const iconField = n.getAttribute('m-tree-icon') || 'icon';
      let selectedEl = null;
      function buildNode(item, depth) {
        const hasKids = Array.isArray(item[childField]) && item[childField].length > 0;
        const row = el('div', 'bm-tree-row');
        row.style.paddingLeft = (depth * 1.25) + 'rem';
        if (hasKids) {
          const toggle = el('span', 'bm-tree-toggle');
          toggle.textContent = '▸';
          row.appendChild(toggle);
        } else {
          row.appendChild(el('span', 'bm-tree-spacer'));
        }
        if (item[iconField]) {
          const ico = el('span', 'bm-tree-icon');
          ico.textContent = item[iconField];
          row.appendChild(ico);
        }
        const lbl = el('span', 'bm-tree-label');
        lbl.textContent = item[labelField] || '';
        row.appendChild(lbl);
        const wrapper = el('div', 'bm-tree-node');
        wrapper.appendChild(row);
        row.addEventListener('click', function(e) {
          e.stopPropagation();
          if (selectedEl) selectedEl.classList.remove('bm-tree-selected');
          row.classList.add('bm-tree-selected');
          selectedEl = row;
          if (selectFn && typeof state[selectFn] === 'function') state[selectFn](item, e);
        });
        if (hasKids) {
          const kids = el('div', 'bm-tree-children');
          if (!item.open) kids.style.display = 'none';
          else row.querySelector('.bm-tree-toggle').textContent = '▾';
          item[childField].forEach(function(child) { kids.appendChild(buildNode(child, depth + 1)); });
          wrapper.appendChild(kids);
          row.querySelector('.bm-tree-toggle').addEventListener('click', function(e) {
            e.stopPropagation();
            const open = kids.style.display === 'none';
            kids.style.display = open ? '' : 'none';
            this.textContent = open ? '▾' : '▸';
          });
        }
        return wrapper;
      }
      function render() {
        const arr = getPath(state, arrKey);
        n.innerHTML = '';
        selectedEl = null;
        n.classList.add('bm-tree');
        if (!Array.isArray(arr)) return;
        arr.forEach(function(item) { n.appendChild(buildNode(item, 0)); });
      }
      render(); watch(wk, render);
    });

    // m-toast (array → toast popup)
    root.querySelectorAll('[m-toast]').forEach(n => {
      const arrKey = n.getAttribute('m-toast'), wk = topKey(arrKey);
      let lastLen = 0;
      function createToast(item) {
        const t = typeof item === 'string' ? { message: item } : item;
        const type = t.type || 'info';
        const dur = t.duration || '5s';
        const durClass = 'to-' + dur.replace(/\s/g, '');
        const dark = type === 'dark';
        const toast = el('div', 'to to-au ' + durClass + (dark ? ' to-dk' : ' to-' + type));
        if (t.title) {
          const header = el('div', 'to-h');
          header.innerHTML = '<span class="to-t">' + (t.title || '') + '</span>' +
            (t.time ? '<span class="to-tm">' + t.time + '</span>' : '');
          const closeBtn = el('button', 'bt-x' + (dark ? ' bt-xw' : ''));
          closeBtn.addEventListener('click', () => toast.remove());
          header.appendChild(closeBtn);
          toast.appendChild(header);
        }
        const body = el('div', 'to-b');
        body.textContent = t.message || '';
        toast.appendChild(body);
        if (t.progress !== false) {
          toast.appendChild(el('div', 'to-pg'));
        }
        toast.addEventListener('animationend', function(e) {
          if (e.animationName === 'toast-auto-dismiss') toast.remove();
        });
        n.appendChild(toast);
      }
      const sync = () => {
        const arr = getPath(state, arrKey);
        if (!Array.isArray(arr)) return;
        while (lastLen < arr.length) { createToast(arr[lastLen]); lastLen++; }
        if (arr.length < lastLen) lastLen = arr.length;
      };
      sync(); watch(wk, sync);
    });
  }

  return { bindComponents };
})();
