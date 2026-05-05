/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../src/BareMetal.Forms.js');

function loadForms() {
  const code = fs.readFileSync(SRC, 'utf8');
  const fn = new Function('document', 'window', 'File', 'FormData', code + '\nreturn BareMetal.Forms;');
  return fn(global.document, global.window, global.File, global.FormData);
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
