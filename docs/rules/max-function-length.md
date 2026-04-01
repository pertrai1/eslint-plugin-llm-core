# Enforce a maximum number of lines per function to encourage decomposition (`llm-core/max-function-length`)

💼 This rule is enabled in the following configs: 🌐 `all`, ✅ `recommended`.

<!-- end auto-generated rule header -->

Enforce a maximum number of lines per function to encourage decomposition.

## Rule Details

LLMs frequently generate monolithic functions with 100+ lines. This rule limits function length, forcing the LLM to extract helpers and decompose logic into focused, testable units.

## Examples

### Incorrect

```ts
// 200-line function doing everything
function processOrder(order: Order) {
  // validate input (20 lines)
  // check inventory (30 lines)
  // calculate pricing (40 lines)
  // apply discounts (25 lines)
  // process payment (35 lines)
  // send confirmation (20 lines)
  // update analytics (30 lines)
}
```

### Correct

```ts
function processOrder(order: Order) {
  validateOrder(order);
  const inventory = checkInventory(order.items);
  const pricing = calculatePricing(order, inventory);
  const total = applyDiscounts(pricing, order.coupon);
  await processPayment(order.payment, total);
  await sendConfirmation(order.email, total);
  trackOrderAnalytics(order);
}
```

## Options

### `max`

Maximum allowed lines per function. Default: `50`.

### `skipBlankLines`

Whether to skip blank lines when counting. Default: `true`.

```json
{
  "llm-core/max-function-length": [
    "error",
    {
      "max": 40,
      "skipBlankLines": true
    }
  ]
}
```

## Error Messages

Error messages follow a structured teaching format designed for LLM self-correction:

1. **What's wrong** — identifies the function and its line count
2. **Why** — explains that long functions are hard to understand and test
3. **How to fix** — three decomposition strategies: extract helpers, single responsibility, separate setup/logic/cleanup
