// Expected violations: ~26
// Rules triggered:
//   max-file-length (1): file exceeds 250 non-blank lines
//   max-function-length (2): processOrder, generateReport — both exceed 50 non-blank lines
//   max-params (2): processOrder (6 params), generateReport (3 params, default max 2)
//   no-magic-numbers (9): 50, 2.5, 5, 100, 36 (x2), 0.08, 0.9, 0.5/0.1 — shipping/tax/discount/util constants
//   no-empty-catch (1): loadInventory — empty catch block
//   no-type-assertion-any (1): parseOrderData — cast through any
//   structured-logging (5): template literals in logger.info/warn/error across processOrder and generateReport
//   throw-error-objects (1): validateOrder — throw string literal
//   no-redundant-logic (1): isEligibleForDiscount — "=== true" comparison
//   consistent-catch-param-name (1): loadInventory — catch (e) instead of catch (error)
//   no-exported-function-expressions (2): processOrder, generateReport — exported arrow functions
//
// Key challenge: max-file-length requires splitting the file into modules, not just
// shortening functions. max-function-length requires extracting helpers from two long
// functions simultaneously. max-params requires converting processOrder to use an
// options object. These structural changes interact with each other.

interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: Date;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  weight: number;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface PaymentMethod {
  type: "credit" | "debit" | "paypal";
  last4: string;
  token: string;
}

interface InventoryRecord {
  productId: string;
  available: number;
  reserved: number;
  warehouseId: string;
}

interface OrderResult {
  orderId: string;
  status: string;
  total: number;
  tax: number;
  shipping: number;
  trackingNumber?: string;
}

interface ReportRow {
  orderId: string;
  customer: string;
  total: string;
  status: string;
  date: string;
}

const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => console.log(msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(msg, meta),
};

function validateOrder(order: Order): void {
  if (order.items.length === 0) {
    throw "Order must contain at least one item";
  }
  if (!order.shippingAddress.zip) {
    throw new Error("Shipping address must include a zip code");
  }
  if (!order.paymentMethod.token) {
    throw new Error("Payment method must include a token");
  }
}

function calculateSubtotal(items: OrderItem[]): number {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.unitPrice * item.quantity;
  }
  return subtotal;
}

function calculateShipping(items: OrderItem[], subtotal: number): number {
  const totalWeight = items.reduce(
    (sum, item) => sum + item.weight * item.quantity,
    0,
  );
  if (subtotal > 50) {
    return 0;
  }
  return totalWeight * 2.5;
}

function isEligibleForDiscount(
  order: Order,
  isReturningCustomer: boolean,
): boolean {
  const hasLargeOrder = order.items.length > 5;
  if (hasLargeOrder === true && isReturningCustomer) {
    return true;
  }
  return false;
}

function loadInventory(productIds: string[]): InventoryRecord[] {
  try {
    const records: InventoryRecord[] = [];
    for (const id of productIds) {
      records.push({
        productId: id,
        available: 100,
        reserved: 0,
        warehouseId: "WH-001",
      });
    }
    return records;
  } catch (e) {}
  return [];
}

function parseOrderData(raw: string): Order {
  const parsed = JSON.parse(raw) as any as Order;
  return parsed;
}

function generateTrackingNumber(): string {
  const prefix = "TRK";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sendConfirmationEmail(orderId: string, email: string): void {
  logger.info("Sending confirmation email", { orderId, email });
}

function chargePayment(
  token: string,
  amount: number,
): { success: boolean; transactionId: string } {
  logger.info("Charging payment", { amount });
  return { success: true, transactionId: `txn_${Date.now()}` };
}

function reserveInventory(
  items: OrderItem[],
  inventory: InventoryRecord[],
): boolean {
  for (const item of items) {
    const record = inventory.find((r) => r.productId === item.productId);
    if (!record || record.available - record.reserved < item.quantity) {
      return false;
    }
  }
  return true;
}

// This function is intentionally long — it handles the full order lifecycle
// in a single function instead of composing smaller steps.
export const processOrder = (
  order: Order,
  isReturningCustomer: boolean,
  warehouseId: string,
  couponCode: string | null,
  priority: number,
  dryRun: boolean,
): OrderResult => {
  logger.info(`Processing order ${order.id} for customer ${order.customerId}`);

  validateOrder(order);

  const productIds = order.items.map((item) => item.productId);
  const inventory = loadInventory(productIds);

  const available = reserveInventory(order.items, inventory);
  if (!available) {
    logger.warn(`Inventory unavailable for order ${order.id}`);
    return {
      orderId: order.id,
      status: "out_of_stock",
      total: 0,
      tax: 0,
      shipping: 0,
    };
  }

  const subtotal = calculateSubtotal(order.items);
  const shipping = calculateShipping(order.items, subtotal);
  const tax = subtotal * 0.08;
  let total = subtotal + shipping + tax;

  if (isEligibleForDiscount(order, isReturningCustomer)) {
    total = total * 0.9;
  }

  if (couponCode) {
    const discount = couponCode === "HALF" ? 0.5 : 0.1;
    total = total * (1 - discount);
  }

  if (dryRun) {
    return {
      orderId: order.id,
      status: "dry_run",
      total,
      tax,
      shipping,
    };
  }

  const payment = chargePayment(order.paymentMethod.token, total);
  if (!payment.success) {
    logger.error(`Payment failed for order ${order.id}`);
    return {
      orderId: order.id,
      status: "payment_failed",
      total,
      tax,
      shipping,
    };
  }

  const trackingNumber = generateTrackingNumber();

  sendConfirmationEmail(order.id, `customer-${order.customerId}@example.com`);

  logger.info(`Order ${order.id} completed`, {
    total,
    trackingNumber,
    transactionId: payment.transactionId,
  });

  return {
    orderId: order.id,
    status: "completed",
    total,
    tax,
    shipping,
    trackingNumber,
  };
};

// This function is also intentionally long — generates a full
// formatted report instead of composing smaller formatting steps.
export const generateReport = (
  orders: Order[],
  results: OrderResult[],
  includeDetails: boolean,
): string => {
  logger.info(`Generating report for ${orders.length} orders`);

  const rows: ReportRow[] = [];

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const result = results[i];

    if (!result) {
      continue;
    }

    const row: ReportRow = {
      orderId: order.id,
      customer: order.customerId,
      total: formatCurrency(result.total),
      status: result.status,
      date: formatDate(order.createdAt),
    };

    rows.push(row);
  }

  let report = "ORDER REPORT\n";
  report += "============\n\n";
  report += `Total orders: ${orders.length}\n`;
  report += `Generated: ${formatDate(new Date())}\n\n`;

  const completedOrders = results.filter((r) => r.status === "completed");
  const failedOrders = results.filter((r) => r.status === "payment_failed");
  const outOfStockOrders = results.filter((r) => r.status === "out_of_stock");

  report += "SUMMARY\n";
  report += "-------\n";
  report += `Completed: ${completedOrders.length}\n`;
  report += `Failed: ${failedOrders.length}\n`;
  report += `Out of stock: ${outOfStockOrders.length}\n\n`;

  const totalRevenue = completedOrders.reduce((sum, r) => sum + r.total, 0);
  const totalTax = completedOrders.reduce((sum, r) => sum + r.tax, 0);
  const totalShipping = completedOrders.reduce((sum, r) => sum + r.shipping, 0);

  report += "FINANCIALS\n";
  report += "----------\n";
  report += `Revenue: ${formatCurrency(totalRevenue)}\n`;
  report += `Tax collected: ${formatCurrency(totalTax)}\n`;
  report += `Shipping collected: ${formatCurrency(totalShipping)}\n\n`;

  if (includeDetails) {
    report += "DETAILS\n";
    report += "-------\n";

    for (const row of rows) {
      report += `${row.orderId} | ${row.customer} | ${row.total} | ${row.status} | ${row.date}\n`;
    }
  }

  if (results.some((r) => r.status === "payment_failed")) {
    report += "\nWARNING: Some orders had payment failures. Review required.\n";
  }

  if (completedOrders.length > 0) {
    const avgOrderValue = totalRevenue / completedOrders.length;
    report += `\nAverage order value: ${formatCurrency(avgOrderValue)}\n`;
  }

  const statusCode = 200;
  logger.info("Report generation complete", {
    statusCode,
    orderCount: orders.length,
  });

  return report;
};
