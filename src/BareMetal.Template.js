// BareMetalTemplate — DOM builder from schema/layout metadata
// Builds BareMetalStyles-compatible forms and list tbs from server-driven structure.
// API: buildForm(layout, fields) → HTMLElement,  buildTable(fields, items, callbacks) → HTMLElement
var BareMetal = (typeof BareMetal !== 'undefined') ? BareMetal : {};
BareMetal.Template = (() => {
  'use strict';

  const INPUT_TYPES = {
    number: 'number', email: 'email', date: 'date',
    'datetime-local': 'datetime-local', time: 'time', password: 'password',
    Integer: 'number', Decimal: 'number', Money: 'number',
    Email: 'email', DateTime: 'datetime-local', Date: 'date', Time: 'time',
    Password: 'password', Url: 'text', Phone: 'tel'
  };
  const COUNTRY_OPTIONS = [
    ['','— Select —'],['AF','Afghanistan'],['AL','Albania'],['DZ','Algeria'],['AR','Argentina'],['AU','Australia'],
    ['AT','Austria'],['BE','Belgium'],['BR','Brazil'],['CA','Canada'],['CN','China'],
    ['CO','Colombia'],['HR','Croatia'],['CZ','Czech Republic'],['DK','Denmark'],['EG','Egypt'],
    ['FI','Finland'],['FR','France'],['DE','Germany'],['GR','Greece'],['HK','Hong Kong'],
    ['HU','Hungary'],['IN','India'],['ID','Indonesia'],['IE','Ireland'],['IL','Israel'],
    ['IT','Italy'],['JP','Japan'],['MX','Mexico'],['NL','Netherlands'],['NZ','New Zealand'],
    ['NG','Nigeria'],['NO','Norway'],['PK','Pakistan'],['PH','Philippines'],['PL','Poland'],
    ['PT','Portugal'],['RO','Romania'],['RU','Russia'],['SA','Saudi Arabia'],['SG','Singapore'],
    ['ZA','South Africa'],['KR','South Korea'],['ES','Spain'],['SE','Sweden'],['CH','Switzerland'],
    ['TW','Taiwan'],['TH','Thailand'],['TR','Turkey'],['UA','Ukraine'],['AE','United Arab Emirates'],
    ['GB','United Kingdom'],['US','United States'],['VN','Vietnam']
  ];
  const mk = (tag, props) => Object.assign(document.createElement(tag), props);

  // Shared: build the appropriate input element for a field schema
  function buildInput(name, f) {
    let inp;
    if (f.type === 'boolean') {
      inp = mk('input', { type: 'checkbox', className: 'fch-i' });
    } else if (f.type === 'textarea') {
      inp = mk('textarea', { className: 'fc', rows: f.rows || 3 });
    } else if (f.type === 'select') {
      inp = mk('select', { className: 'fsl' });
      [{ value: '', label: '— select —' }, ...(f.options || [])].forEach(o => {
        const isObj = o !== null && typeof o === 'object';
        inp.appendChild(mk('option', {
          value: isObj ? String(o.value ?? '') : String(o),
          textContent: isObj ? String(o.label ?? o.value ?? o) : String(o)
        }));
      });
    } else if (f.type === 'Country') {
      inp = mk('select', { className: 'fsl' });
      COUNTRY_OPTIONS.forEach(c => {
        inp.appendChild(mk('option', { value: c[0], textContent: c[1] }));
      });
    } else if (f.type === 'file') {
      inp = mk('input', { type: 'file', className: 'fc' });
      if (f.accept) inp.accept = f.accept;
    } else {
      inp = mk('input', { className: 'fc', type: INPUT_TYPES[f.type] || 'text' });
      if (f.type === 'Integer') inp.step = '1';
    }

    inp.setAttribute('m-value', name);
    if (f.required) inp.required = true;
    if (f.placeholder) inp.placeholder = f.placeholder;
    if (f.readonly) { inp.disabled = true; inp.classList.add('bg-lt'); }
    return inp;
  }

  function buildLabel(name, f) {
    return mk('label', {
      className: 'fl fsb',
      textContent: f.label || name.replace(/([A-Z])/g, ' $1').trim()
    });
  }

  function buildForm(layout, fields) {
    const form = mk('form', { className: 'mb3' });
    form.setAttribute('m-submit', 'save');
    const cols = layout.columns || 1;
    const rw  = mk('div', { className: 'rw g3' });

    (layout.fields || Object.keys(fields)).forEach(name => {
      const f = fields[name] || {};

      if (f.type === 'hidden') {
        const inp = mk('input', { type: 'hidden' });
        inp.setAttribute('m-value', name);
        rw.appendChild(inp);
        return;
      }

      const col = mk('div', { className: 'cm' + Math.floor(12 / cols) });

      if (f.type === 'boolean') {
        const wrap = mk('div', { className: 'fch mt2' });
        const chkId = 'f_' + name;
        const inp = buildInput(name, f);
        inp.id = chkId;
        const chkLabel = mk('label', { className: 'fch-l', htmlFor: chkId,
          textContent: f.label || name.replace(/([A-Z])/g, ' $1').trim() });
        wrap.append(inp, chkLabel);
        col.appendChild(wrap);
        rw.appendChild(col);
        return;
      }

      const lbl = buildLabel(name, f);
      const inp = buildInput(name, f);

      if (f.type === 'select' && f.lookupUrl) {
        const grp = mk('div', { className: 'ig ig-s' });
        grp.appendChild(inp);
        const targetSlug = f.lookupUrl.replace(/[?#].*$/, '').replace(/\/$/, '').split('/').pop();
        const addBtn = mk('a', {
          href: '/' + targetSlug + '/create',
          className: 'bt bt-os', title: 'Add new', target: '_blank',
          textContent: '+'
        });
        const refBtn = mk('button', { type: 'button', className: 'bt bt-os', title: 'Refresh', textContent: '↻' });
        refBtn.dataset.lookupRefresh = name;
        refBtn.dataset.lookupUrl = f.lookupUrl;
        refBtn.dataset.lookupValueField = f.lookupValueField || 'id';
        refBtn.dataset.lookupDisplayField = f.lookupDisplayField || 'name';
        grp.append(addBtn, refBtn);
        col.append(lbl, grp);
      } else {
        col.append(lbl, inp);
      }
      rw.appendChild(col);
    });

    const foot = mk('div', { className: 'c12 mt2 fx gp2' });
    foot.appendChild(mk('button', { type: 'submit', className: 'bt bt-p', textContent: 'Save' }));
    rw.appendChild(foot);
    form.appendChild(rw);
    return form;
  }

  function buildTable(fields, items, callbacks) {
    const cb    = callbacks || {};
    const resolve = cb.resolve || ((name, v) => String(v ?? ''));
    const names = Object.keys(fields).filter(n => !fields[n].readonly).slice(0, 6);
    const wrap  = mk('div', { className: 'tb-r' });
    const tbl   = mk('table', { className: 'tb tb-h tb-s vam' });
    const hrw  = tbl.createTHead().insertRow();
    names.forEach(n => hrw.appendChild(mk('th', { textContent: fields[n]?.label || n })));
    hrw.appendChild(mk('th', { className: 'te' }));
    const tbody = tbl.createTBody();
    items.forEach(item => {
      const tr = tbody.insertRow();
      names.forEach(n => {
        const td = tr.insertCell();
        if (fields[n]?.type === 'boolean') {
          const v = item[n];
          td.innerHTML = (v === true || v === 'true' || v === 1)
            ? '<span class="bd bg-ok">✓</span>'
            : '<span class="bd bg-s">✗</span>';
        } else {
          td.textContent = resolve(n, item[n]);
        }
      });
      const td = tr.insertCell(); td.className = 'te';
      const id = item.id || item.Id || '';
      if (cb.onView) {
        const b = mk('button', { className: 'bt bt-s bt-op me1', textContent: '👁' });
        b.onclick = () => cb.onView(id, item); td.appendChild(b);
      }
      if (cb.onEdit) {
        const b = mk('button', { className: 'bt bt-s bt-os me1', textContent: '✏' });
        b.onclick = () => cb.onEdit(id, item); td.appendChild(b);
      }
      if (cb.onDelete) {
        const b = mk('button', { className: 'bt bt-s bt-oer', textContent: '🗑' });
        b.onclick = () => cb.onDelete(id, item); td.appendChild(b);
      }
    });
    wrap.appendChild(tbl);
    return wrap;
  }

  return { buildForm, buildTable, buildInput, buildLabel };
})();
