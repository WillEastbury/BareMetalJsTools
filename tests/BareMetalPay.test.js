/**
 * @jest-environment jest-environment-jsdom
 */
'use strict';

const path = require('path');

const SRC_PATH = path.resolve(__dirname, '../src/BareMetal.Pay.js');

function loadPay() {
  jest.resetModules();
  delete require.cache[require.resolve(SRC_PATH)];
  return require(SRC_PATH);
}

describe('BareMetal.Pay', () => {
  let Pay;
  let originalPaymentRequest;

  beforeEach(() => {
    originalPaymentRequest = global.PaymentRequest;
    delete global.PaymentRequest;
    Pay = loadPay();
  });

  afterEach(() => {
    if (originalPaymentRequest) global.PaymentRequest = originalPaymentRequest;
    else delete global.PaymentRequest;
    jest.restoreAllMocks();
  });

  test('canPay reflects PaymentRequest availability', () => {
    expect(Pay.canPay()).toBe(false);
    global.PaymentRequest = function PaymentRequest() {};
    expect(Pay.canPay()).toBe(true);
  });

  test('request wraps PaymentRequest.show and normalizes shorthand methods', async () => {
    const show = jest.fn().mockResolvedValue({
      methodName: 'basic-card',
      complete: jest.fn().mockResolvedValue(),
      retry: jest.fn().mockResolvedValue()
    });
    const abort = jest.fn().mockResolvedValue();
    const PaymentRequestMock = jest.fn(function PaymentRequest(methods, details, opts) {
      this.methods = methods;
      this.details = details;
      this.opts = opts;
      this.show = show;
      this.abort = abort;
    });
    global.PaymentRequest = PaymentRequestMock;
    Pay = loadPay();

    const response = await Pay.request({
      total: { label: 'Total', amount: { currency: 'USD', value: 19.99 } },
      displayItems: [{ label: 'Widget', amount: { currency: 'USD', value: 19.99 } }]
    }, 'basic-card', { requestPayerEmail: true });

    expect(PaymentRequestMock).toHaveBeenCalledWith([
      { supportedMethods: 'basic-card', data: {} }
    ], {
      total: { label: 'Total', amount: { currency: 'USD', value: '19.99' } },
      displayItems: [{ label: 'Widget', amount: { currency: 'USD', value: '19.99' } }]
    }, { requestPayerEmail: true });
    expect(show).toHaveBeenCalledTimes(1);
    expect(response.request.abort).toBe(abort);
  });

  test('request rejects when PaymentRequest is unavailable', async () => {
    await expect(Pay.request({ total: { label: 'Total', amount: { currency: 'USD', value: 1 } } })).rejects.toThrow(/unavailable/i);
  });

  test('method builders produce expected shapes', () => {
    expect(Pay.card({ supportedNetworks: ['visa'], supportedTypes: ['credit'] })).toEqual({
      supportedMethods: 'basic-card',
      data: { supportedNetworks: ['visa'], supportedTypes: ['credit'] }
    });
    expect(Pay.googlePay({ environment: 'TEST' })).toEqual({
      supportedMethods: 'https://google.com/pay',
      data: { environment: 'TEST' }
    });
    expect(Pay.applePay({ version: 3 })).toEqual({
      supportedMethods: 'https://apple.com/apple-pay',
      data: { version: 3 }
    });
  });

  test('cart supports add remove update clear and toDetails', () => {
    const cart = Pay.cart();
    cart.add({ id: 'a', label: 'Alpha', amount: 10, qty: 2, currency: 'USD' })
      .add({ id: 'b', label: 'Beta', amount: 2.5, qty: 3, currency: 'USD' });

    expect(cart.getItems()).toEqual([
      { id: 'a', label: 'Alpha', amount: 10, qty: 2, currency: 'USD', pending: false },
      { id: 'b', label: 'Beta', amount: 2.5, qty: 3, currency: 'USD', pending: false }
    ]);
    expect(cart.getTotal('USD')).toBe(27.5);

    cart.update('b', 1);
    expect(cart.getTotal('USD')).toBe(22.5);
    cart.remove('a');
    expect(cart.getTotal('USD')).toBe(2.5);
    expect(cart.toDetails('Pay now')).toEqual({
      displayItems: [{ label: 'Beta', amount: { currency: 'USD', value: '2.50' }, pending: false }],
      total: { label: 'Pay now', amount: { currency: 'USD', value: '2.50' } }
    });
    cart.clear();
    expect(cart.getItems()).toEqual([]);
    expect(cart.getTotal('USD')).toBe(0);
  });

  test('shipping builder tracks selected option', () => {
    const shipping = Pay.shipping({ currency: 'GBP' });
    shipping.add('standard', 'Standard', 5, true).add('express', 'Express', 15, false);

    expect(shipping.getSelected()).toEqual({
      id: 'standard',
      label: 'Standard',
      amount: { currency: 'GBP', value: '5.00' },
      selected: true
    });
    expect(shipping.toArray()).toEqual([
      { id: 'standard', label: 'Standard', amount: { currency: 'GBP', value: '5.00' }, selected: true },
      { id: 'express', label: 'Express', amount: { currency: 'GBP', value: '15.00' }, selected: false }
    ]);
  });

  test('validate performs card type detection and luhn checking', () => {
    expect(Pay.validate('4111 1111 1111 1111')).toEqual({ valid: true, type: 'Visa' });
    expect(Pay.validate('5555555555554444')).toEqual({ valid: true, type: 'MasterCard' });
    expect(Pay.validate('378282246310005')).toEqual({ valid: true, type: 'Amex' });
    expect(Pay.validate('6011111111111117')).toEqual({ valid: true, type: 'Discover' });
    expect(Pay.validate('4111111111111112')).toEqual({ valid: false, type: 'Visa' });
    expect(Pay.validate('123456')).toEqual({ valid: false, type: null });
  });

  test('formatCurrency uses Intl.NumberFormat', () => {
    expect(Pay.formatCurrency(12.34, 'USD', 'en-US')).toBe('$12.34');
    expect(Pay.formatCurrency('99.9', 'GBP', 'en-GB')).toMatch(/99\.90/);
  });

  test('abort complete and retry delegate to response methods', async () => {
    const abort = jest.fn().mockResolvedValue();
    const complete = jest.fn().mockResolvedValue('done');
    const retry = jest.fn().mockResolvedValue('retried');
    const response = { request: { abort }, complete, retry };

    await expect(Pay.abort(response)).resolves.toBe(true);
    await expect(Pay.complete(response, 'success')).resolves.toBe('done');
    await expect(Pay.retry(response, { cardNumber: 'bad' })).resolves.toBe('retried');
    expect(abort).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith('success');
    expect(retry).toHaveBeenCalledWith({ cardNumber: 'bad' });
  });

  test('request normalizes complex methods and details', async () => {
    const show = jest.fn().mockResolvedValue({ request: { existing: true } });
    const PaymentRequestMock = jest.fn(function PaymentRequest(methods, details, opts) {
      this.methods = methods;
      this.details = details;
      this.opts = opts;
      this.show = show;
    });
    global.PaymentRequest = PaymentRequestMock;
    Pay = loadPay();

    const shipping = Pay.shipping([{ id: 'std', label: 'Standard', amount: 5 }]);
    const details = {
      id: 42,
      total: { label: 'Order total', amount: { value: 12.345, currency: 'EUR' } },
      displayItems: [{ id: 'sku-1', amount: 10, pending: true }],
      shippingOptions: shipping,
      modifiers: [{ supportedMethods: 'basic-card' }]
    };
    const response = await Pay.request(details, [
      ['basic-card', { googlePay: { environment: 'TEST' } }],
      { type: 'apple', config: { version: 3 } },
      { supportedMethods: 'https://custom-pay', data: 'raw' }
    ]);

    expect(PaymentRequestMock).toHaveBeenCalledWith([
      { supportedMethods: 'basic-card', data: {} },
      { supportedMethods: 'https://google.com/pay', data: { environment: 'TEST' } },
      { supportedMethods: 'https://apple.com/apple-pay', data: { version: 3 } },
      { supportedMethods: 'https://custom-pay', data: 'raw' }
    ], {
      id: '42',
      total: { label: 'Order total', amount: { currency: 'EUR', value: '12.35' } },
      displayItems: [{ label: 'sku-1', amount: { currency: 'EUR', value: '10.00' }, pending: true }],
      shippingOptions: [{ id: 'std', label: 'Standard', amount: { currency: 'USD', value: '5.00' }, selected: true }],
      modifiers: [{ supportedMethods: 'basic-card' }]
    }, {});
    expect(response.request).toBe(PaymentRequestMock.mock.instances[0]);
  });

  test('formatCurrency falls back when Intl formatting throws', () => {
    const original = Intl.NumberFormat;
    Intl.NumberFormat = jest.fn(() => { throw new Error('no intl'); });
    try {
      expect(Pay.formatCurrency('9.5', 'ZZZ')).toBe('ZZZ 9.50');
    } finally {
      Intl.NumberFormat = original;
    }
  });

  test('cart handles seeded data, duplicate ids, removals, and mixed currencies', () => {
    const cart = Pay.cart([
      { id: 'a', name: 'Alpha', value: 5, qty: 1, currency: 'USD' },
      { id: 'eur', label: 'Euro', amount: 3, qty: 2, currency: 'EUR', pending: true }
    ]);

    cart.add({ id: 'a', amount: 7, qty: 2 })
      .add({ id: 'zero', amount: 1, qty: 0 })
      .update('missing', 4)
      .update('eur', 0)
      .remove('missing');

    expect(cart.getItems()).toEqual([
      { id: 'a', label: 'Alpha', amount: 7, qty: 3, currency: 'USD', pending: false }
    ]);
    expect(cart.getTotal()).toBe(21);
    expect(cart.getTotal('EUR')).toBe(0);
  });

  test('shipping normalizes default selection and object additions', () => {
    const shipping = Pay.shipping({
      currency: 'CAD',
      options: [
        { id: 'slow', label: 'Slow', amount: 2 },
        { id: 'fast', label: 'Fast', amount: { value: 10, currency: 'CAD' }, selected: true }
      ]
    });

    shipping.add({ id: 'pickup', label: 'Pickup', amount: 0, selected: false });

    expect(shipping.getSelected()).toEqual({
      id: 'fast',
      label: 'Fast',
      amount: { currency: 'CAD', value: '10.00' },
      selected: true
    });
    expect(shipping.toArray()).toHaveLength(3);
  });

  test('validate handles empty and non-digit card numbers', () => {
    expect(Pay.validate('')).toEqual({ valid: false, type: null });
    expect(Pay.validate('abcd-efgh')).toEqual({ valid: false, type: null });
  });

  test('abort, complete, and retry return false when methods are unavailable or fail', async () => {
    await expect(Pay.abort({ request: { abort: () => Promise.reject(new Error('boom')) } })).resolves.toBe(false);
    await expect(Pay.complete({}, 'success')).resolves.toBe(false);
    await expect(Pay.retry({}, { field: 'bad' })).resolves.toBe(false);
  });
});
