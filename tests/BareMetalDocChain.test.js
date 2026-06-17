/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');
const fs = require('fs');

const SRC_PATH = path.resolve(__dirname, '../src/BareMetal.DocChain.js');

function loadDocChain() {
  const code = fs.readFileSync(SRC_PATH, 'utf8');
  const win = { BareMetal: {} };
  const fn = new Function('window', 'globalThis', 'module', 'exports', 'BareMetal', code + '\nreturn window.BareMetal.DocChain || BareMetal.DocChain || module.exports;');
  return fn(win, win, { exports: {} }, {}, win.BareMetal);
}

function setupTypes(DC) {
  DC.defineType('quotation', {
    fields: {
      customer: { type: 'string', required: true },
      total: 'number',
      items: 'array'
    },
    allowedChildren: ['order'],
    allowedTransitions: ['sent', 'approved', 'rejected', 'expired'],
    meta: { family: 'sales' }
  });
  DC.defineType('order', {
    allowedChildren: ['dispatch', 'invoice'],
    allowedTransitions: ['confirmed', 'cancelled']
  });
  DC.defineType('dispatch', {
    allowedChildren: ['pod'],
    allowedTransitions: ['shipped', 'delivered']
  });
  DC.defineType('invoice', {
    allowedChildren: ['payment', 'credit'],
    allowedTransitions: ['sent', 'paid', 'overdue']
  });
  DC.defineType('payment', {
    allowedChildren: ['ledger'],
    allowedTransitions: ['cleared', 'bounced']
  });
  DC.defineType('ledger', {
    allowedChildren: [],
    allowedTransitions: ['posted']
  });
}

function createChain(DC) {
  const quote = DC.create('quotation', { customer: 'Acme', total: 5000, items: ['widget'] }, { id: 'quote-1' });
  const order = DC.derive(quote, 'order', { poNumber: 'PO-001' }, { inherit: ['customer', 'total', 'items'] });
  const dispatch = DC.derive(order, 'dispatch', { carrier: 'DHL', tracking: 'DHL123' });
  const invoice = DC.derive(order, 'invoice', { invoiceNo: 'INV-001', dueDate: '2024-02-01' });
  const payment = DC.derive(invoice, 'payment', { receipt: 'RCPT-1' });
  return { quote, order, dispatch, invoice, payment };
}

describe('BareMetal.DocChain', () => {
  let DC;

  beforeEach(() => {
    DC = loadDocChain();
    setupTypes(DC);
    DC.store.clear();
  });

  test('defineType registers document types and lifecycle defaults', () => {
    const type = DC.defineType('credit-note', {
      fields: { amount: { type: 'number', required: true } },
      allowedChildren: ['ledger'],
      allowedTransitions: ['issued'],
      meta: { source: 'billing' }
    });

    expect(type).toEqual(expect.objectContaining({
      name: 'credit-note',
      allowedChildren: ['ledger'],
      allowedTransitions: ['issued'],
      meta: { source: 'billing' }
    }));
    expect(DC.lifecycle('credit-note')).toEqual({ initial: 'draft', terminal: [], transitions: {} });
  });

  test('create supports root and child documents and auto-links parent children', () => {
    const quote = DC.create('quotation', { customer: 'Acme', total: 5000 });
    const order = DC.create('order', { poNumber: 'PO-001' }, { parent: quote, status: 'confirmed' });

    expect(quote.parentId).toBeNull();
    expect(order.parentId).toBe(quote.id);
    expect(quote.children).toEqual([order.id]);
    expect(DC.store.roots().map((doc) => doc.id)).toEqual([quote.id]);
  });

  test('derive validates allowedChildren and applies inheritance/transform rules', () => {
    const quote = DC.create('quotation', { customer: 'Acme', total: 5000, items: ['a'] });
    const order = DC.derive(quote, 'order', { poNumber: 'PO-001' }, {
      inherit: ['customer', 'total'],
      transform: {
        summary: function(_, parent, payload) {
          return parent.data.customer + ':' + payload.poNumber;
        }
      }
    });

    expect(order.data).toEqual(expect.objectContaining({
      customer: 'Acme',
      total: 5000,
      poNumber: 'PO-001',
      summary: 'Acme:PO-001'
    }));
    expect(() => DC.derive(order, 'quotation', {})).toThrow(/not allowed/);
  });

  test('transition validates allowedTransitions and records audit entries', () => {
    const quote = DC.create('quotation', { customer: 'Acme', total: 5000 });

    DC.transition(quote, 'approved', { actor: 'sales@co.com', reason: 'signed' });

    expect(quote.status).toBe('approved');
    expect(quote.version).toBe(2);
    expect(DC.audit(quote)).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: 'transition', from: 'draft', to: 'approved', actor: 'sales@co.com', reason: 'signed' })
    ]));
    expect(() => DC.transition(quote, 'posted')).toThrow(/not allowed/);
  });

  test('chain walks to root and lineage excludes the current document', () => {
    const chain = createChain(DC);
    const steps = DC.chain(chain.payment);

    expect(steps.map((entry) => entry.doc.type)).toEqual(['quotation', 'order', 'invoice', 'payment']);
    expect(steps.map((entry) => entry.depth)).toEqual([0, 1, 2, 3]);
    expect(DC.lineage(chain.payment).map((doc) => doc.type)).toEqual(['quotation', 'order', 'invoice']);
  });

  test('descendants supports depth, type, and status filters', () => {
    const chain = createChain(DC);
    DC.transition(chain.invoice, 'sent');

    expect(DC.descendants(chain.order, { depth: 1 }).map((doc) => doc.type).sort()).toEqual(['dispatch', 'invoice']);
    expect(DC.descendants(chain.order, { type: 'payment' }).map((doc) => doc.id)).toEqual([chain.payment.id]);
    expect(DC.descendants(chain.order, { status: 'sent' }).map((doc) => doc.id)).toEqual([chain.invoice.id]);
  });

  test('tree builds a recursive structure', () => {
    const chain = createChain(DC);
    const tree = DC.tree(chain.quote);

    expect(tree.doc.id).toBe(chain.quote.id);
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].doc.id).toBe(chain.order.id);
    expect(tree.children[0].children.map((branch) => branch.doc.type).sort()).toEqual(['dispatch', 'invoice']);
    expect(tree.children[0].children.find((branch) => branch.doc.id === chain.invoice.id).children[0].doc.id).toBe(chain.payment.id);
  });

  test('visualize returns Graph-compatible nodes and edges including links', () => {
    const chain = createChain(DC);
    DC.link(chain.invoice, chain.dispatch, 'references');

    const graph = DC.visualize(chain.quote);

    expect(graph.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: chain.quote.id, type: 'quotation', status: 'draft', depth: 0 }),
      expect.objectContaining({ id: chain.invoice.id, type: 'invoice', depth: 2 })
    ]));
    expect(graph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: chain.quote.id, to: chain.order.id, source: chain.quote.id, target: chain.order.id, relation: 'child' }),
      expect.objectContaining({ from: chain.invoice.id, to: chain.dispatch.id, source: chain.invoice.id, target: chain.dispatch.id, relation: 'references' })
    ]));
  });

  test('lifecycle terminal states block further transitions', () => {
    DC.lifecycle('invoice', {
      initial: 'draft',
      terminal: ['paid', 'cancelled'],
      transitions: {
        draft: ['sent'],
        sent: ['paid', 'cancelled']
      }
    });
    const invoice = DC.create('invoice', { invoiceNo: 'INV-2' });

    expect(DC.validate(invoice, { to: 'sent' })).toEqual({ valid: true, errors: [] });
    DC.transition(invoice, 'sent');
    DC.transition(invoice, 'paid');

    expect(() => DC.transition(invoice, 'overdue')).toThrow(/terminal state/);
    expect(DC.validate(invoice, { to: 'overdue' })).toEqual(expect.objectContaining({ valid: false }));
  });

  test('serialize and deserialize round-trip a full chain', () => {
    const chain = createChain(DC);
    DC.link(chain.invoice, chain.dispatch, 'amends');
    const data = DC.serialize(chain.quote);
    const Fresh = loadDocChain();

    const restoredRoot = Fresh.deserialize(data);
    const restoredInvoice = Fresh.store.get(chain.invoice.id);

    expect(restoredRoot.id).toBe(chain.quote.id);
    expect(Fresh.chain(restoredInvoice).map((entry) => entry.doc.type)).toEqual(['quotation', 'order', 'invoice']);
    expect(Fresh.links(restoredInvoice, 'from')).toEqual([
      expect.objectContaining({ relation: 'amends', to: chain.dispatch.id })
    ]);
  });

  test('hooks fire on create, derive, and transition', () => {
    const onCreate = jest.fn();
    const onDerive = jest.fn();
    const onTransition = jest.fn();
    DC.onCreate('quotation', onCreate);
    DC.onDerive('quotation', 'order', onDerive);
    DC.onTransition('quotation', 'draft', 'approved', onTransition);

    const quote = DC.create('quotation', { customer: 'Acme', total: 5000 });
    const order = DC.derive(quote, 'order', { poNumber: 'PO-001' });
    DC.transition(quote, 'approved', { actor: 'sales@co.com' });

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ doc: quote, parent: null }));
    expect(onDerive).toHaveBeenCalledWith(expect.objectContaining({ parent: quote, child: order }));
    expect(onTransition).toHaveBeenCalledWith(expect.objectContaining({ doc: quote, from: 'draft', to: 'approved', actor: 'sales@co.com' }));
  });

  test('store query helpers return matching documents', () => {
    const chain = createChain(DC);
    DC.transition(chain.invoice, 'sent');

    expect(DC.store.byType('invoice').map((doc) => doc.id)).toEqual([chain.invoice.id]);
    expect(DC.store.byStatus('sent').map((doc) => doc.id)).toEqual([chain.invoice.id]);
    expect(DC.store.byParent(chain.order.id).map((doc) => doc.type).sort()).toEqual(['dispatch', 'invoice']);
    expect(DC.store.roots().map((doc) => doc.id)).toEqual([chain.quote.id]);
    expect(DC.query({ type: 'invoice', status: 'sent', parentId: chain.order.id })).toEqual([chain.invoice]);
  });

  test('link and links manage cross references in both directions', () => {
    const chain = createChain(DC);
    const duplicate = DC.create('invoice', { invoiceNo: 'INV-DUP' }, { parent: chain.order });
    const link = DC.link(chain.invoice, duplicate, 'duplicates');

    expect(link).toEqual(expect.objectContaining({ from: chain.invoice.id, to: duplicate.id, relation: 'duplicates' }));
    expect(DC.links(chain.invoice, 'from')).toEqual([expect.objectContaining({ id: link.id })]);
    expect(DC.links(duplicate, 'to')).toEqual([expect.objectContaining({ id: link.id })]);
    expect(DC.links(chain.invoice, 'both')).toHaveLength(1);
  });

  test('clone creates deep copies with optional children and reset status', () => {
    const chain = createChain(DC);
    DC.transition(chain.order, 'confirmed');

    const shallow = DC.clone(chain.order);
    const deep = DC.clone(chain.order, { includeChildren: true, resetStatus: true });
    const deepChildren = DC.store.byParent(deep.id);

    expect(shallow.id).not.toBe(chain.order.id);
    expect(shallow.parentId).toBeNull();
    expect(shallow.children).toEqual([]);
    expect(deep.id).not.toBe(chain.order.id);
    expect(deep.status).toBe('draft');
    expect(deepChildren.map((doc) => doc.type).sort()).toEqual(['dispatch', 'invoice']);
    expect(DC.descendants(deep, { type: 'payment' })).toHaveLength(1);
  });
});
