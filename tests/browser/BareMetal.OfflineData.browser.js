BareMetal.TestRunner.installGlobals();

describe('BareMetal.OfflineData', function () {
  var sequence = 0;

  async function createClient(send, options) {
    sequence++;
    var name = 'bm-offline-data-test-' + Date.now() + '-' + sequence;
    var db = await BareMetal.IDB.open(name, {
      version: 1,
      stores: {
        records: { keyPath: 'id' },
        outbox: { keyPath: 'id' }
      }
    });
    return {
      db: db,
      client: BareMetal.OfflineData.create(Object.assign({ db: db, send: send }, options || {}))
    };
  }

  it('applies optimistic writes and replaces them with acknowledged records', async function () {
    var sent = [];
    var context = await createClient(function (operation) {
      sent.push(operation);
      return Promise.resolve({ record: { id: operation.key, title: 'server-confirmed', status: 'saved' } });
    });
    await context.client.put('order-1', { title: 'local edit', status: 'pending' }, { method: 'PUT', url: '/orders/order-1' });
    expect((await context.client.get('order-1')).title).toBe('local edit');
    expect((await context.client.pending()).length).toBe(1);
    var result = await context.client.flush();
    expect(result.sent.length).toBe(1);
    expect(sent[0].optimistic.status).toBe('pending');
    expect((await context.client.get('order-1')).title).toBe('server-confirmed');
    expect((await context.client.pending()).length).toBe(0);
    context.db.close();
  });

  it('keeps optimistic data and a durable outbox entry when offline', async function () {
    var context = await createClient(function () { return Promise.reject(new TypeError('network offline')); });
    await context.client.put('customer-1', { id: 'customer-1', name: 'Updated locally' }, { method: 'PUT' });
    var rejected = false;
    try { await context.client.flush(); }
    catch (error) { rejected = error.message === 'network offline'; }
    var pending = await context.client.pending();
    expect(rejected).toBe(true);
    expect((await context.client.get('customer-1')).name).toBe('Updated locally');
    expect(pending.length).toBe(1);
    expect(pending[0].attempts).toBe(1);
    context.db.close();
  });

  it('auto-flushes new writes when the online replay mode is enabled', async function () {
    var sent = 0;
    var context = await createClient(function (operation) {
      sent++;
      return Promise.resolve({ record: operation.optimistic });
    }, { autoFlush: true });
    await context.client.put('auto-1', { id: 'auto-1', value: 'ready' }, { method: 'PUT' });
    for (var index = 0; index < 30 && (await context.client.pending()).length; index++) {
      await new Promise(function (resolve) { setTimeout(resolve, 10); });
    }
    expect(sent).toBe(1);
    expect((await context.client.pending()).length).toBe(0);
    context.client.destroy();
    context.db.close();
  });

  it('surfaces conflicts and resolves them through the mounted conflict UI', async function () {
    var context = await createClient(function () {
      var error = new Error('The record changed on the server');
      error.status = 409;
      error.remote = { id: 'record-1', title: 'Server title', quantity: 3 };
      return Promise.reject(error);
    });
    await context.db.put('records', { id: 'record-1', title: 'Original', quantity: 1 });
    await context.client.put('record-1', { id: 'record-1', title: 'Local title', quantity: 2 }, { method: 'PUT' });
    var result = await context.client.flush();
    expect(result.conflict.status).toBe('conflict');
    expect(result.conflict.remote.title).toBe('Server title');
    var mount = document.createElement('div');
    document.body.appendChild(mount);
    var ui = context.client.mountConflictUI(mount);
    await ui.refresh();
    expect(ui.el.textContent.indexOf('Your version') >= 0).toBe(true);
    expect(ui.el.textContent.indexOf('Server version') >= 0).toBe(true);
    var useServer = Array.from(ui.el.querySelectorAll('button')).find(function (button) {
      return button.textContent === 'Use server';
    });
    useServer.click();
    for (var index = 0; index < 30 && (await context.client.conflicts()).length; index++) {
      await new Promise(function (resolve) { setTimeout(resolve, 10); });
    }
    expect((await context.client.get('record-1')).title).toBe('Server title');
    expect((await context.client.conflicts()).length).toBe(0);
    ui.destroy();
    context.db.close();
  });
});
