/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

const SRC = path.resolve(__dirname, '../src/BareMetal.Forms.js');

function loadForms() {
  jest.resetModules();
  delete require.cache[require.resolve(SRC)];
  return require(SRC);
}

function fire(el, type) {
  el.dispatchEvent(new Event(type, { bubbles: true }));
}

describe('BareMetal.Forms', () => {
  let Forms;

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    Forms = loadForms();
  });

  test('serialize and deserialize handle common input types', () => {
    const form = document.createElement('form');
    const file = new File(['hello'], 'demo.txt', { type: 'text/plain' });
    form.innerHTML = [
      '<input name="name" value="Alice">',
      '<input type="checkbox" name="agree" checked>',
      '<input type="radio" name="role" value="user">',
      '<input type="radio" name="role" value="admin" checked>',
      '<select name="color"><option value="red">Red</option><option value="blue" selected>Blue</option></select>',
      '<select name="tags" multiple><option value="a" selected>A</option><option value="b">B</option><option value="c" selected>C</option></select>',
      '<input type="file" name="avatar">'
    ].join('');
    document.body.appendChild(form);
    Object.defineProperty(form.querySelector('[name="avatar"]'), 'files', { configurable: true, value: [file] });

    expect(Forms.serialize(form)).toEqual({
      name: 'Alice',
      agree: true,
      role: 'admin',
      color: 'blue',
      tags: ['a', 'c'],
      avatar: file
    });

    Forms.deserialize(form, { name: 'Bob', agree: false, role: 'user', color: 'red', tags: ['b'] });

    expect(form.querySelector('[name="name"]').value).toBe('Bob');
    expect(form.querySelector('[name="agree"]').checked).toBe(false);
    expect(form.querySelector('[name="role"][value="user"]').checked).toBe(true);
    expect(form.querySelector('[name="color"]').value).toBe('red');
    expect(Array.from(form.querySelector('[name="tags"]').selectedOptions).map((o) => o.value)).toEqual(['b']);
  });

  test('validate supports required, length, pattern, email, custom and match rules', () => {
    const form = document.createElement('form');
    form.innerHTML = [
      '<input name="username" value="ab">',
      '<input name="email" value="bad">',
      '<input name="code" value="12">',
      '<input name="password" value="secret1">',
      '<input name="confirm" value="secret2">'
    ].join('');

    const result = Forms.validate(form, {
      username: { required: true, minLength: 3, label: 'Username' },
      email: { email: true },
      code: { pattern: /^\d{3}$/ },
      password: { custom: (v) => v.indexOf('!') === -1 ? 'Need a symbol.' : null },
      confirm: { match: 'password', label: 'Confirm password' }
    });

    expect(result.valid).toBe(false);
    expect(result.errors.username[0]).toMatch(/Username/);
    expect(result.errors.email[0]).toMatch(/email/i);
    expect(result.errors.code[0]).toMatch(/format/i);
    expect(result.errors.password[0]).toBe('Need a symbol.');
    expect(result.errors.confirm[0]).toMatch(/match/i);
  });

  test('create and getState track dirty and touched state', () => {
    const form = document.createElement('form');
    form.innerHTML = '<input name="first" value="Alice"><input name="email" value="a@example.com">';
    document.body.appendChild(form);
    const api = Forms.create(form, { fields: { email: { email: true } } });

    expect(api.getState()).toEqual(expect.objectContaining({ dirty: false, pristine: true, touched: false, untouched: true }));

    const input = form.querySelector('[name="first"]');
    input.value = 'Bob';
    fire(input, 'input');
    fire(input, 'blur');

    const state = Forms.getState(form);
    expect(state.dirty).toBe(true);
    expect(state.touched).toBe(true);
    expect(state.values.first).toBe('Bob');
  });

  test('mask formats input and keeps cursor stable on backspace', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    Forms.mask(input, '(###) ###-####');

    input.value = '1234567890';
    input.setSelectionRange(10, 10);
    fire(input, 'input');

    expect(input.value).toBe('(123) 456-7890');

    input.setSelectionRange(input.value.length, input.value.length);
    const ev = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true });
    input.dispatchEvent(ev);

    expect(input.value).toBe('(123) 456-789');
    expect(input.selectionStart).toBe(input.value.length);
  });

  test('wizard navigates steps and blocks next when validate fails', () => {
    const form = document.createElement('form');
    form.innerHTML = [
      '<div data-step="one"><input name="name" value=""></div>',
      '<div data-step="two"><input name="email" value=""></div>'
    ].join('');
    document.body.appendChild(form);

    const wiz = Forms.wizard(form, [
      { id: 'one', fields: ['name'], validate: (vals) => !!vals.name },
      { id: 'two', fields: ['email'] }
    ]);

    expect(wiz.getCurrentStep().id).toBe('one');
    expect(wiz.next()).toBe(0);

    form.querySelector('[name="name"]').value = 'Alice';
    expect(wiz.next()).toBe(1);
    expect(wiz.isLast()).toBe(true);
    expect(form.querySelector('[data-step="one"]').style.display).toBe('none');
    expect(wiz.prev()).toBe(0);
  });

  test('autosave persists and restores form values', async () => {
    const form = document.createElement('form');
    form.innerHTML = '<input name="name" value=""><input name="age" value="">';
    document.body.appendChild(form);
    const api = Forms.autosave(form, { key: 'forms-test', debounce: 5 });

    form.querySelector('[name="name"]').value = 'Alice';
    form.querySelector('[name="age"]').value = '42';
    fire(form.querySelector('[name="name"]'), 'input');
    await new Promise((resolve) => setTimeout(resolve, 15));

    expect(JSON.parse(localStorage.getItem('forms-test'))).toEqual({ name: 'Alice', age: '42' });

    form.querySelector('[name="name"]').value = '';
    form.querySelector('[name="age"]').value = '';
    api.restore();

    expect(Forms.serialize(form)).toEqual({ name: 'Alice', age: '42' });
    api.clear();
    expect(localStorage.getItem('forms-test')).toBeNull();
  });

  test('conditional shows and hides dependent fields', () => {
    const form = document.createElement('form');
    form.innerHTML = [
      '<div data-field="type"><select name="type"><option value="personal">Personal</option><option value="business">Business</option></select></div>',
      '<div data-field="company"><input name="company"></div>',
      '<div data-field="vat"><input name="vat"></div>'
    ].join('');
    document.body.appendChild(form);
    Forms.conditional(form, [{ when: { field: 'type', equals: 'business' }, show: ['company', 'vat'] }]);

    expect(form.querySelector('[data-field="company"]').style.display).toBe('none');
    form.querySelector('[name="type"]').value = 'business';
    fire(form.querySelector('[name="type"]'), 'change');
    expect(form.querySelector('[data-field="company"]').style.display).toBe('');
    expect(form.querySelector('[data-field="vat"]').style.display).toBe('');
  });

  test('diff returns only changed fields', () => {
    const form = document.createElement('form');
    form.innerHTML = '<input name="name" value="Alice"><input name="role" value="admin">';
    document.body.appendChild(form);
    const api = Forms.create(form, {});

    form.querySelector('[name="role"]').value = 'user';
    fire(form.querySelector('[name="role"]'), 'input');

    expect(Forms.diff(form)).toEqual({ role: 'user' });
    api.reset();
    expect(Forms.diff(form)).toEqual({});
  });

  test('fromJSON generates semantic HTML and returns a working form instance', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = Forms.fromJSON(host, {
      layout: 'vertical',
      fields: [
        { name: 'name', type: 'text', label: 'Full name', placeholder: 'Jane' },
        { name: 'bio', type: 'textarea', label: 'Bio' },
        { name: 'role', type: 'select', label: 'Role', options: [{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }] }
      ]
    });

    expect(host.querySelector('form')).not.toBeNull();
    expect(host.querySelector('label[for="name"]').textContent).toBe('Full name');
    expect(host.querySelector('textarea[name="bio"]')).not.toBeNull();
    expect(host.querySelectorAll('select[name="role"] option')).toHaveLength(2);

    api.setValues({ name: 'Jane', bio: 'Hello', role: 'admin' });
    expect(api.getValues()).toEqual({ name: 'Jane', bio: 'Hello', role: 'admin' });
  });

  test('repeater adds, removes and serializes rows', () => {
    const host = document.createElement('div');
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = 'Add';
    document.body.appendChild(addBtn);
    document.body.appendChild(host);

    const rep = Forms.repeater(host, {
      template: '<div><input name="item"><button type="button" data-remove>Remove</button></div>',
      addBtn,
      min: 1
    });

    expect(rep.getAll()).toHaveLength(1);
    rep.add({ item: 'A' });
    rep.add({ item: 'B' });
    expect(rep.getAll()).toEqual([{ item: '' }, { item: 'A' }, { item: 'B' }]);
    rep.remove(1);
    expect(rep.getAll()).toEqual([{ item: '' }, { item: 'B' }]);
  });

  test('submit applies loading state and clears errors on success', async () => {
    const form = document.createElement('form');
    const box = document.createElement('div');
    box.id = 'errors';
    form.innerHTML = '<input name="email" value="ok@example.com"><button type="submit">Send</button>';
    document.body.appendChild(form);
    document.body.appendChild(box);
    Forms.create(form, { fields: { email: { email: true } } });
    Forms.submit(form, () => Promise.resolve({ ok: true }), { loadingClass: 'loading', disableOnSubmit: true, errorContainer: '#errors' });

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(form.classList.contains('loading')).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(form.classList.contains('loading')).toBe(false);
    expect(box.textContent).toBe('');
  });
});

describe('BareMetal.Forms additional coverage', () => {
  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
    sessionStorage.clear();
  });

  test('toFormData, API callbacks, reset, and destroy cover richer form state paths', () => {
    const Forms = loadForms();
    const container = document.createElement('div');
    const file = new File(['x'], 'x.txt', { type: 'text/plain' });
    container.innerHTML = [
      '<input name="email" value="ok@example.com">',
      '<input type="checkbox" name="flags" value="a" checked>',
      '<input type="checkbox" name="flags" value="b" checked>',
      '<input type="radio" name="role" value="user">',
      '<input type="radio" name="role" value="admin" checked>',
      '<select name="tags" multiple><option value="x" selected>X</option><option value="y" selected>Y</option></select>',
      '<input type="file" name="upload">'
    ].join('');
    Object.defineProperty(container.querySelector('[name="upload"]'), 'files', { configurable: true, value: [file] });

    const entries = Array.from(Forms.toFormData(container).entries());
    expect(entries).toEqual(expect.arrayContaining([
      ['email', 'ok@example.com'],
      ['flags', 'a'],
      ['flags', 'b'],
      ['role', 'admin'],
      ['tags', 'x'],
      ['tags', 'y'],
      ['upload', file]
    ]));

    const form = document.createElement('form');
    form.innerHTML = '<input name="email" value="ok@example.com"><input name="name" value="Alice">';
    document.body.appendChild(form);
    const api = Forms.create(form, { fields: { email: { email: true } } });
    const changeSpy = jest.fn();
    const submitSpy = jest.fn();
    api.onChange(changeSpy).onSubmit(submitSpy);

    form.querySelector('[name="name"]').value = 'Bob';
    fire(form.querySelector('[name="name"]'), 'input');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(changeSpy).toHaveBeenCalled();
    expect(submitSpy).toHaveBeenCalledWith(expect.objectContaining({ email: 'ok@example.com', name: 'Bob' }), expect.any(Event), expect.objectContaining({ valid: true }));

    api.reset();
    expect(Forms.serialize(form)).toEqual({ email: 'ok@example.com', name: 'Alice' });
    api.destroy();

    form.querySelector('[name="name"]').value = 'Charlie';
    fire(form.querySelector('[name="name"]'), 'input');
    expect(changeSpy).toHaveBeenCalledTimes(1);
  });

  test('wizard, repeater, and conditional cover schema validation callbacks and teardown', () => {
    const Forms = loadForms();
    const form = document.createElement('form');
    form.innerHTML = [
      '<div data-step="one" class="field"><input name="name" value=""></div>',
      '<div data-step="two" class="field"><input name="company" value=""></div>',
      '<div data-field="plan"><select name="plan"><option value="free">Free</option><option value="pro">Pro</option></select></div>',
      '<div data-field="team"><input name="team" value=""></div>'
    ].join('');
    document.body.appendChild(form);
    Forms.create(form, { fields: { name: { required: true }, company: { required: true } } });
    const steps = [];
    const wizard = Forms.wizard(form, [{ id: 'one', fields: ['name'] }, { id: 'two', fields: ['company'] }]).onStep((step) => steps.push(step.id));

    expect(wizard.next()).toBe(0);
    form.querySelector('[name="name"]').value = 'Acme';
    expect(wizard.next()).toBe(1);
    expect(wizard.goTo(0)).toBe(0);
    expect(wizard.submit()).toEqual(expect.objectContaining({ name: 'Acme' }));
    expect(steps).toContain('two');

    const conditional = Forms.conditional(form, [
      { when: { field: 'plan', notEquals: 'free' }, show: ['team'] }
    ]);
    expect(form.querySelector('[data-field="team"]').style.display).toBe('none');
    form.querySelector('[name="plan"]').value = 'pro';
    fire(form.querySelector('[name="plan"]'), 'change');
    expect(form.querySelector('[data-field="team"]').style.display).toBe('');
    conditional.destroy();
    expect(form.querySelector('[data-field="team"]').style.display).toBe('');
    expect(form.querySelector('[data-field="team"]').hasAttribute('aria-hidden')).toBe(false);

    const host = document.createElement('div');
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    document.body.appendChild(addBtn);
    document.body.appendChild(host);
    const added = jest.fn();
    const removed = jest.fn();
    const repeater = Forms.repeater(host, {
      template: '<div data-bm-repeat-item><input name="item"><button type="button" data-remove>Remove</button></div>',
      addBtn,
      min: 1,
      max: 2
    }).onAdd(added).onRemove(removed);

    addBtn.click();
    addBtn.click();
    expect(repeater.getAll()).toHaveLength(2);
    expect(added).toHaveBeenCalled();
    host.querySelector('[data-remove]').click();
    expect(removed).toHaveBeenCalled();
    repeater.destroy();
  });

  test('autosave, submit failure handling, and success reset paths work with callbacks', async () => {
    jest.useFakeTimers();
    const Forms = loadForms();
    const bucket = {
      data: {},
      setItem(key, value) { this.data[key] = value; },
      getItem(key) { return this.data[key] || null; },
      removeItem(key) { delete this.data[key]; }
    };
    const form = document.createElement('form');
    const box = document.createElement('div');
    box.id = 'errors2';
    form.innerHTML = '<input name="email" value="bad"><button type="submit">Send</button>';
    document.body.appendChild(form);
    document.body.appendChild(box);
    const saveSpy = jest.fn();
    const restoreSpy = jest.fn();
    const autosave = Forms.autosave(form, { key: 'custom', debounce: 5, storage: bucket, onSave: saveSpy, onRestore: restoreSpy });

    form.querySelector('[name="email"]').value = 'user@example.com';
    fire(form.querySelector('[name="email"]'), 'input');
    await jest.advanceTimersByTimeAsync(10);
    expect(saveSpy).toHaveBeenCalled();
    expect(JSON.parse(bucket.getItem('custom'))).toEqual({ email: 'user@example.com' });
    form.querySelector('[name="email"]').value = '';
    expect(autosave.restore()).toEqual({ email: 'user@example.com' });
    expect(restoreSpy).toHaveBeenCalledWith({ email: 'user@example.com' });
    autosave.clear();
    expect(bucket.getItem('custom')).toBeNull();
    autosave.destroy();

    Forms.create(form, { fields: { email: { email: true } } });
    Forms.submit(form, () => Promise.reject(new Error('Server rejected')), { errorContainer: '#errors2', disableOnSubmit: true, loadingClass: 'saving' });
    form.querySelector('[name="email"]').value = 'broken';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(form.querySelector('[name="email"]').getAttribute('aria-invalid')).toBe('true');

    form.querySelector('[name="email"]').value = 'done@example.com';
    const success = Forms.submit(form, () => Promise.resolve({ ok: true }), { resetOnSuccess: true });
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();
    expect(box.textContent).toBe('Server rejected');
    success.destroy();
  });

  test('fromJSON and focus cover grouped fields and keyboard navigation', async () => {
    jest.useFakeTimers();
    const Forms = loadForms();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = Forms.fromJSON(host, {
      layout: 'inline',
      fields: [
        { name: 'username', type: 'text', label: 'User', required: true },
        { name: 'role', type: 'radio', label: 'Role', options: [{ value: 'user', label: 'User', checked: true }, { value: 'admin', label: 'Admin' }] },
        { name: 'prefs', type: 'checkbox', label: 'Prefs', options: [{ value: 'a', label: 'A', checked: true }, { value: 'b', label: 'B' }] },
        { name: 'tos', type: 'checkbox', label: 'Accept', checked: true }
      ]
    });
    const form = api.form;
    const focusables = Array.from(form.querySelectorAll('input,button,select,textarea'));
    focusables.forEach((el) => Object.defineProperty(el, 'offsetParent', { configurable: true, get: () => form }));
    const focusApi = Forms.focus(form, { tabTrap: true });

    form.querySelector('[name="username"]').focus();
    form.querySelector('[name="username"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(form.querySelector('[name="role"]'));

    const last = focusables[focusables.length - 1];
    last.focus();
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(focusables[0]);

    form.querySelector('[name="username"]').value = '';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await jest.advanceTimersByTimeAsync(0);
    expect(document.activeElement).toBe(form.querySelector('[name="username"]'));

    api.setValues({ username: 'Jane', role: 'admin', prefs: ['b'], tos: false });
    expect(api.getValues()).toEqual({ username: 'Jane', role: 'admin', prefs: ['b'], tos: false });
    focusApi.destroy();
  });
});

describe('branch coverage - Forms', () => {
  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  test('validation and state helpers cover guard clauses and optional branches', () => {
    const Forms = loadForms();
    const form = document.createElement('form');
    form.innerHTML = [
      '<input type="number" name="ageLow" value="4">',
      '<input type="number" name="ageHigh" value="9">',
      '<input name="nick" value="AB12">',
      '<input name="site" value="notaurl">',
      '<input name="bio" value="abc">',
      '<input name="title" value="toolong">',
      '<input name="sameA" value="left">',
      '<input name="sameB" value="right">',
      '<input name="noop" value="ok">',
      '<input name="throws" value="ok">',
      '<input name="regexSkip" value="keep">',
      '<input type="checkbox" name="agree">'
    ].join('');
    document.body.appendChild(form);

    const result = Forms.validate(form, {
      ageLow: { type: 'number', min: 5 },
      ageHigh: { type: 'number', max: 8 },
      nick: { pattern: '^[A-Z]+$' },
      site: { url: true },
      bio: { min: 4 },
      title: { max: 3 },
      sameB: { match: 'sameA' },
      noop: { custom: () => undefined },
      throws: { custom: () => { throw new Error('ignore'); } },
      regexSkip: { pattern: '[' },
      agree: { required: true, label: 'Agree' }
    });

    expect(result.valid).toBe(false);
    expect(result.errors.ageLow[0]).toMatch(/at least 5/);
    expect(result.errors.ageHigh[0]).toMatch(/at most 8/);
    expect(result.errors.nick[0]).toMatch(/format/i);
    expect(result.errors.site[0]).toMatch(/valid URL/i);
    expect(result.errors.bio[0]).toMatch(/at least 4 characters/i);
    expect(result.errors.title[0]).toMatch(/at most 3 characters/i);
    expect(result.errors.sameB[0]).toMatch(/must match/i);
    expect(result.errors.agree[0]).toMatch(/Agree is required/);
    expect(result.errors.noop).toBeUndefined();
    expect(result.errors.throws).toBeUndefined();
    expect(result.errors.regexSkip).toBeUndefined();

    const raw = document.createElement('form');
    raw.innerHTML = '<input name="requiredName" required value="">';
    expect(Forms.getState(raw)).toEqual(expect.objectContaining({ valid: false, invalid: true }));
  });

  test('non-form serialization helpers and mask cover empty and teardown branches', () => {
    const Forms = loadForms();
    const host = document.createElement('div');
    host.innerHTML = [
      '<input type="checkbox" name="single" value="yes">',
      '<input type="checkbox" name="many" value="a">',
      '<input type="checkbox" name="many" value="b">',
      '<select name="pick" multiple><option value="x">X</option><option value="y">Y</option></select>',
      '<input type="radio" name="role" value="user">',
      '<input type="radio" name="role" value="admin">',
      '<input type="file" name="upload" multiple>',
      '<input name="pair" value="">',
      '<input name="pair" value="">'
    ].join('');
    document.body.appendChild(host);
    Object.defineProperty(host.querySelector('[name="upload"]'), 'files', { configurable: true, value: [] });

    Forms.deserialize(host, {
      single: 'false',
      many: ['b'],
      pick: ['y'],
      role: 'admin',
      pair: ['left', null]
    });

    expect(Forms.serialize(host)).toEqual({
      single: false,
      many: ['b'],
      pick: ['y'],
      role: 'admin',
      upload: [],
      pair: ['left', '']
    });

    const entries = Array.from(Forms.toFormData(host).entries());
    expect(entries).toEqual(expect.arrayContaining([
      ['many', 'b'],
      ['pick', 'y'],
      ['role', 'admin'],
      ['pair', 'left'],
      ['pair', '']
    ]));
    expect(entries.some(([key]) => key === 'upload')).toBe(false);

    const input = document.createElement('input');
    document.body.appendChild(input);
    const masked = Forms.mask(input, '###-AA');
    input.value = '129b';
    input.setSelectionRange(input.value.length, input.value.length);
    fire(input, 'input');
    expect(input.value).toBe('129-B');
    masked.destroy();
    input.value = '777q';
    fire(input, 'input');
    expect(input.value).toBe('777q');
  });

  test('wizard repeater conditional autosave submit and focus cover edge paths', async () => {
    jest.useFakeTimers();
    const Forms = loadForms();
    const form = document.createElement('form');
    form.innerHTML = [
      '<div class="field" data-step="one"><input name="name" value=""></div>',
      '<div class="field"><input name="extra" value=""></div>',
      '<div data-field="plan"><select name="plan"><option value="">None</option><option value="pro">Pro</option><option value="team">Team</option></select></div>',
      '<div data-field="team"><input name="team" value=""></div>',
      '<div data-field="notes"><input name="notes" value=""></div>',
      '<button type="submit">Send</button>'
    ].join('');
    document.body.appendChild(form);
    Forms.create(form, { fields: { name: { required: true } } });

    const wizard = Forms.wizard(form, [{ id: 'one', fields: ['name'] }, { fields: ['extra'] }]);
    expect(wizard.goTo(-1)).toBe(0);
    expect(wizard.next()).toBe(0);
    form.querySelector('[name="name"]').value = 'Alice';
    expect(wizard.next()).toBe(1);
    expect(wizard.prev()).toBe(0);

    const conditional = Forms.conditional(form, [
      { when: { field: 'plan', in: ['pro', 'team'] }, show: ['team'] },
      { when: { field: 'name', truthy: true }, show: ['notes'] }
    ]);
    expect(form.querySelector('[data-field="team"]').style.display).toBe('none');
    form.querySelector('[name="plan"]').value = 'team';
    fire(form.querySelector('[name="plan"]'), 'change');
    expect(form.querySelector('[data-field="team"]').style.display).toBe('');
    expect(form.querySelector('[data-field="notes"]').style.display).toBe('');
    conditional.destroy();
    expect(form.querySelector('[data-field="team"]').style.display).toBe('');

    const host = document.createElement('div');
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    document.body.appendChild(addBtn);
    document.body.appendChild(host);
    const repeater = Forms.repeater(host, {
      template: '<div data-bm-repeat-item><input name="item"><button type="button" data-remove>Remove</button></div>',
      addBtn,
      min: 1,
      max: 1
    });
    expect(repeater.getAll()).toEqual([{ item: '' }]);
    expect(repeater.add({ item: 'blocked' })).toBeNull();
    expect(repeater.remove(99)).toBe(false);
    expect(repeater.remove(0)).toBe(false);
    repeater.destroy();

    const brokenBucket = {
      setItem() { throw new Error('save'); },
      getItem() { throw new Error('load'); },
      removeItem: jest.fn()
    };
    const autosave = Forms.autosave(form, { key: 'broken', debounce: 5, storage: brokenBucket });
    form.querySelector('[name="name"]').value = 'Saved';
    fire(form.querySelector('[name="name"]'), 'input');
    await jest.advanceTimersByTimeAsync(10);
    expect(autosave.restore()).toBeNull();
    autosave.clear();
    autosave.destroy();
    expect(brokenBucket.removeItem).toHaveBeenCalledWith('broken');

    const pendingHandler = jest.fn(() => new Promise(() => {}));
    Forms.submit(form, pendingHandler, { disableOnSubmit: true });
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(pendingHandler).toHaveBeenCalledTimes(1);

    const errorBox = document.createElement('div');
    errorBox.id = 'branch-errors';
    document.body.appendChild(errorBox);
    const submitApi = Forms.submit(form, () => Promise.reject('plain failure'), { errorContainer: '#branch-errors', loadingClass: 'busy' });
    form.querySelector('[name="name"]').value = 'Ready';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();
    expect(errorBox.textContent).toBe('plain failure');
    submitApi.destroy();

    const focusForm = document.createElement('form');
    focusForm.innerHTML = '<input name="first"><input name="second"><button type="submit">Go</button>';
    document.body.appendChild(focusForm);
    const focusApi = Forms.focus(focusForm, { nextOnEnter: false, tabTrap: true });
    const focusables = Array.from(focusForm.querySelectorAll('input,button,select,textarea'));
    focusables.forEach((el) => Object.defineProperty(el, 'offsetParent', { configurable: true, get: () => focusForm }));
    focusables[0].focus();
    focusables[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(focusables[0]);
    focusables[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(focusables[focusables.length - 1]);
    focusApi.destroy();
  });
});
