BareMetal.TestRunner.installGlobals();

describe('BareMetal.Bind reactive()', function () {
  var bind;
  beforeEach(function () { bind = BareMetal.Bind; });

  test('returns state, watch, and data properties', function () {
    var r = bind.reactive({ x: 1 });
    expect(r).toHaveProperty('state');
    expect(r).toHaveProperty('watch');
    expect(r).toHaveProperty('data');
  });

  test('state reads initial values', function () {
    var state = bind.reactive({ name: 'Alice', age: 30 }).state;
    expect(state.name).toBe('Alice');
    expect(state.age).toBe(30);
  });

  test('setting state property notifies registered watcher', function () {
    var r = bind.reactive({ count: 0 });
    var spy = mock.fn();
    r.watch('count', spy);
    r.state.count = 5;
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('setting state property updates data object', function () {
    var r = bind.reactive({ val: 'old' });
    r.state.val = 'new';
    expect(r.data.val).toBe('new');
  });

  test('multiple watchers on the same key are all called', function () {
    var r = bind.reactive({ x: 0 });
    var spy1 = mock.fn();
    var spy2 = mock.fn();
    r.watch('x', spy1);
    r.watch('x', spy2);
    r.state.x = 42;
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
  });

  test('watcher for a different key is NOT called', function () {
    var r = bind.reactive({ a: 1, b: 2 });
    var spyA = mock.fn();
    r.watch('a', spyA);
    r.state.b = 99;
    expect(spyA).not.toHaveBeenCalled();
  });
});

describe('BareMetal.Bind m-text', function () {
  var bind;
  beforeEach(function () { bind = BareMetal.Bind; });

  test('sets textContent from state on initial bind', function () {
    var root = document.createElement('div');
    root.innerHTML = '<span m-text="greeting"></span>';
    var r = bind.reactive({ greeting: 'Hello' });
    bind.bind(root, r.state, r.watch);
    expect(root.querySelector('span').textContent).toBe('Hello');
  });

  test('updates textContent when state changes', function () {
    var root = document.createElement('div');
    root.innerHTML = '<span m-text="msg"></span>';
    var r = bind.reactive({ msg: 'before' });
    bind.bind(root, r.state, r.watch);
    r.state.msg = 'after';
    expect(root.querySelector('span').textContent).toBe('after');
  });

  test('textContent is empty string when state value is undefined', function () {
    var root = document.createElement('div');
    root.innerHTML = '<span m-text="missing"></span>';
    var r = bind.reactive({});
    bind.bind(root, r.state, r.watch);
    expect(root.querySelector('span').textContent).toBe('');
  });
});

describe('BareMetal.Bind native controls', function () {
  test('binds select, range and radio inputs two-way', function () {
    var bind = BareMetal.Bind;
    var r = bind.reactive({ mode: 'fast', level: 42, speed: 3 });
    var root = document.createElement('div');
    root.innerHTML =
      '<select m-value="mode"><option value="slow">Slow</option><option value="fast">Fast</option></select>' +
      '<input type="range" m-value="level" min="0" max="100">' +
      '<input type="radio" name="speed" m-value="speed" value="1">' +
      '<input type="radio" name="speed" m-value="speed" value="3">';
    bind.bind(root, r.state, r.watch);
    expect(root.querySelector('select').value).toBe('fast');
    expect(root.querySelector('input[type=range]').value).toBe('42');
    expect(root.querySelectorAll('input[type=radio]')[1].checked).toBe(true);
    root.querySelector('select').value = 'slow';
    root.querySelector('select').dispatchEvent(new Event('change'));
    root.querySelector('input[type=range]').value = '75';
    root.querySelector('input[type=range]').dispatchEvent(new Event('input'));
    root.querySelectorAll('input[type=radio]')[0].checked = true;
    root.querySelectorAll('input[type=radio]')[0].dispatchEvent(new Event('change'));
    expect(r.state.mode).toBe('slow');
    expect(r.state.level).toBe(75);
    expect(r.state.speed).toBe(1);
  });

  test('binds checkbox and native multi-select inputs two-way', function () {
    var bind = BareMetal.Bind;
    var r = bind.reactive({ enabled: false, selected: ['a'] });
    var root = document.createElement('div');
    root.innerHTML =
      '<input type="checkbox" m-value="enabled">' +
      '<select multiple m-value="selected"><option value="a">A</option><option value="b">B</option></select>';
    bind.bind(root, r.state, r.watch);
    root.querySelector('input').checked = true;
    root.querySelector('input').dispatchEvent(new Event('change'));
    var select = root.querySelector('select');
    select.options[0].selected = false;
    select.options[1].selected = true;
    select.dispatchEvent(new Event('change'));
    expect(r.state.enabled).toBe(true);
    expect(r.state.selected).toEqual(['b']);
  });
});

describe('BareMetal.Bind m-each mutations', function () {
  test('adds and removes rows through reactive directives', function () {
    var bind = BareMetal.Bind;
    var r = bind.reactive({ tasks: [{ id: 1, title: 'First' }] });
    var root = document.createElement('div');
    root.innerHTML =
      '<button m-add="tasks" m-add-default=\'{"id":2,"title":"Added"}\'>Add</button>' +
      '<ul m-each="tasks key:id"><template><li><span m-text=".title"></span><button m-remove="tasks" m-remove-key="id">Remove</button></li></template></ul>';
    bind.bind(root, r.state, r.watch);
    root.querySelector('[m-add]').dispatchEvent(new Event('click'));
    expect(r.state.tasks.length).toBe(2);
    expect(root.querySelectorAll('li')).toHaveLength(2);
    root.querySelectorAll('[m-remove]')[1].dispatchEvent(new Event('click'));
    expect(r.state.tasks.length).toBe(1);
  });

  test('appendList and removeList helpers mutate arrays', function () {
    var bind = BareMetal.Bind;
    var r = bind.reactive({ tasks: [{ id: 1 }] });
    expect(bind.appendList(r.state, 'tasks', { id: 2 })).toBe(true);
    expect(r.state.tasks.length).toBe(2);
    expect(bind.removeList(r.state, 'tasks', { id: 1 }, { key: 'id' })).toBe(true);
    expect(r.state.tasks).toEqual([{ id: 2 }]);
  });
});

describe('BareMetal.Bind many-to-many relations', function () {
  test('binds a checklist and updates selected objects', function () {
    var bind = BareMetal.Bind;
    var r = bind.reactive({
      tags: [{ id: 1, name: 'Electronic' }],
      tagOptions: [
        { id: 1, name: 'Electronic' },
        { id: 2, name: 'Live' }
      ]
    });
    var root = document.createElement('div');
    root.innerHTML = '<div m-many-checklist="tags" m-options="tagOptions" m-value-field="id" m-label-field="name"></div>';
    bind.bind(root, r.state, r.watch);
    var checks = root.querySelectorAll('input[type=checkbox]');
    expect(checks).toHaveLength(2);
    expect(checks[0].checked).toBe(true);
    checks[1].checked = true;
    checks[1].dispatchEvent(new Event('change'));
    expect(r.state.tags.map(function (tag) { return tag.id; })).toEqual([1, 2]);
  });

  test('binds a native multi-select', function () {
    var bind = BareMetal.Bind;
    var r = bind.reactive({
      artists: [2],
      artistOptions: [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' }
      ]
    });
    var root = document.createElement('div');
    root.innerHTML = '<select m-many-select="artists" m-options="artistOptions" m-value-field="id" m-label-field="name"></select>';
    bind.bind(root, r.state, r.watch);
    var select = root.querySelector('select');
    expect(select.options[1].selected).toBe(true);
    select.options[0].selected = true;
    select.options[1].selected = false;
    select.dispatchEvent(new Event('change'));
    expect(r.state.artists).toEqual([{ id: 1, name: 'A' }]);
  });
});
