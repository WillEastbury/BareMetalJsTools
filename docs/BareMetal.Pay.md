# BareMetal.Pay

> Payment Request helpers for checkout setup, cart totals, shipping options, card validation, and currency formatting.

**Size:** 11 KB source / 8 KB minified  
**Dependencies:** None

## Quick Start

```html
<button id="payBtn">Pay now</button>
<script src="BareMetal.Pay.min.js"></script>
<script>
  const cart = BareMetal.Pay.cart([
    { id: 'sku-1', label: 'T-Shirt', amount: 29.99, qty: 2, currency: 'USD' },
    { id: 'ship', label: 'Shipping', amount: 5, qty: 1, currency: 'USD' }
  ]);

  document.getElementById('payBtn').addEventListener('click', async function () {
    const response = await BareMetal.Pay.request(cart.toDetails('Order total'));
    await BareMetal.Pay.complete(response, 'success');
  });
</script>
```

## API Reference

### `canPay()` → `boolean`

Reports whether the browser exposes the Payment Request API.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
if (!BareMetal.Pay.canPay()) console.warn('Payment Request API unavailable');
```

### `request(details, methods, opts)` → `Promise<PaymentResponse>`

Creates a `PaymentRequest`, normalizes details and methods, shows the browser UI, and returns the payment response.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| details | object | — | Payment details object or any object with `toDetails()`. |
| methods | string \| object \| array | `card()` | Payment method descriptors or shorthand values such as `'card'`, `'google-pay'`, or `'apple-pay'`. |
| opts | object | `{}` | Optional native `PaymentRequest` options such as payer/shipping flags. |

**Example:**
```js
const response = await BareMetal.Pay.request(cart.toDetails(), [
  BareMetal.Pay.card({ supportedNetworks: ['visa', 'mastercard'] })
], {
  requestPayerEmail: true
});
```

### `card(opts)` → `object`

Builds a normalized `basic-card` payment method descriptor.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| opts | string \| array \| object | `{}` | String or array shorthand for `supportedNetworks`, or a full config object. |

**Example:**
```js
const method = BareMetal.Pay.card({
  supportedNetworks: ['visa', 'mastercard'],
  supportedTypes: ['credit']
});
```

### `googlePay(config)` → `object`

Builds a `https://google.com/pay` method descriptor.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| config | object | `{}` | Provider-specific Google Pay data payload. |

**Example:**
```js
const method = BareMetal.Pay.googlePay({ environment: 'TEST' });
```

### `applePay(config)` → `object`

Builds a `https://apple.com/apple-pay` method descriptor.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| config | object | `{}` | Provider-specific Apple Pay data payload. |

**Example:**
```js
const method = BareMetal.Pay.applePay({ version: 3, merchantIdentifier: 'merchant.demo' });
```

### `formatCurrency(amount, currency, locale)` → `string`

Formats a numeric amount with `Intl.NumberFormat`, with a safe string fallback.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| amount | number | — | Amount to format. |
| currency | string | `'USD'` | ISO currency code. |
| locale | string | browser default | Optional locale such as `en-GB`. |

**Example:**
```js
console.log(BareMetal.Pay.formatCurrency(1299.5, 'GBP', 'en-GB'));
```

### `cart(seed)` → `cart`

Creates a chainable cart helper with item management and Payment Request detail generation.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| seed | object \| array | `[]` | Initial cart item or item array. |

**Example:**
```js
const cart = BareMetal.Pay.cart().add({ id: 'sku-1', label: 'Hat', amount: 19.99, qty: 1 });
```

### `cart.add(item)` → `cart`

Adds or merges a cart item.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| item | object | — | Item with `id`, `label`/`name`, `amount`/`value`, `qty`, `currency`, and `pending`. |

**Example:**
```js
cart.add({ id: 'sku-2', label: 'Mug', amount: 12.5, qty: 2 });
```

### `cart.remove(id)` → `cart`

Removes a cart item by id.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| id | string | — | Item identifier to remove. |

**Example:**
```js
cart.remove('sku-2');
```

### `cart.update(id, qty)` → `cart`

Updates quantity for an item, removing it when the new quantity is `0`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| id | string | — | Item identifier. |
| qty | number | — | New quantity. |

**Example:**
```js
cart.update('sku-1', 3);
```

### `cart.clear()` → `cart`

Removes all cart items.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
cart.clear();
```

### `cart.getTotal(currency)` → `number`

Returns the summed total, optionally filtered to one currency.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| currency | string | all currencies | Optional currency filter. |

**Example:**
```js
console.log(cart.getTotal('USD'));
```

### `cart.getItems()` → `array`

Returns a cloned array of cart items.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(cart.getItems());
```

### `cart.toDetails(label)` → `object`

Converts the cart to a Payment Request-compatible details object with `displayItems` and `total`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| label | string | `'Total'` | Total label for the details object. |

**Example:**
```js
const details = cart.toDetails('Checkout total');
```

### `shipping(options)` → `shipping`

Creates a shipping option helper for Payment Request `shippingOptions` arrays.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| options | array \| object | `[]` | Array of options or `{ options, currency }`. |

**Example:**
```js
const shipping = BareMetal.Pay.shipping({
  currency: 'USD',
  options: [
    { id: 'standard', label: 'Standard', amount: 5, selected: true },
    { id: 'express', label: 'Express', amount: 15 }
  ]
});
```

### `shipping.add(id, label, amount, selected)` → `shipping`

Adds a shipping option. You can also pass a single object.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| id | string \| object | — | Option id or a full option object. |
| label | string | `'Shipping'` | Option label when using positional arguments. |
| amount | number \| object | `0` | Amount or amount object. |
| selected | boolean | `false` | Marks the option as selected. |

**Example:**
```js
shipping.add('overnight', 'Overnight', 25, false);
```

### `shipping.getSelected()` → `object | null`

Returns the selected option, or the first option when nothing is explicitly selected.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
console.log(shipping.getSelected());
```

### `shipping.toArray()` → `array`

Returns cloned shipping options ready for `PaymentRequest` details.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| — | — | — | No parameters. |

**Example:**
```js
details.shippingOptions = shipping.toArray();
```

### `validate(cardNumber)` → `object`

Runs a Luhn check and card type detection.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| cardNumber | string | — | Card number with or without separators. |

**Example:**
```js
const check = BareMetal.Pay.validate('4111 1111 1111 1111');
// { valid: true, type: 'Visa' }
```

### `abort(response)` → `Promise<boolean>`

Aborts an in-progress payment request or response when an `abort()` method is available.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| response | object | — | Payment response, request, or object carrying `request` / `__request`. |

**Example:**
```js
await BareMetal.Pay.abort(response);
```

### `complete(response, result)` → `Promise<boolean>`

Calls `response.complete()` when supported.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| response | PaymentResponse | — | Payment response returned from `request()`. |
| result | string | `'unknown'` | Completion state such as `success`, `fail`, or `unknown`. |

**Example:**
```js
await BareMetal.Pay.complete(response, 'success');
```

### `retry(response, errors)` → `Promise<boolean>`

Calls `response.retry()` with a copied error payload when supported.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| response | PaymentResponse | — | Payment response returned from `request()`. |
| errors | object | `{}` | Validation errors keyed by payment field. |

**Example:**
```js
await BareMetal.Pay.retry(response, {
  payer: { email: 'Please use a work email address.' }
});
```

## Notes

- `request()` accepts raw detail objects, cart helpers, and method shorthands; it normalizes them before opening the browser sheet.
- The resolved payment response keeps a reference to the underlying request on `response.request` or `response.__request`.
- `cart()` merges items with the same `id` and defaults missing currency values to `USD`.
- `shipping()` ensures there is always a selected option when the list is not empty.
- `validate()` recognizes Visa, MasterCard, Amex, and Discover.
