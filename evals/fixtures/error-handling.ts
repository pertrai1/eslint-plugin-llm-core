interface Order {
  id: string;
  status: "pending" | "complete" | "cancelled";
  total: number;
}

const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => console.log(msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(msg, meta),
};

function isValidOrderId(id: string): boolean {
  return id.trim() !== "";
}

export async function fetchOrder(orderId: string): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}`);
  const data = (response as any).json();
  logger.info(`Fetched order ${orderId}`);
  return data as Order;
}

export async function processOrder(orderId: string): Promise<void> {
  try {
    const order = await fetchOrder(orderId);
    await submitOrder(order);
  } catch (error: any) {
    console.error(`Order processing failed: ${error.message}`);
    throw "Order processing failed";
  }
}

async function submitOrder(order: Order): Promise<void> {
  if (!isValidOrderId(order.id)) {
    throw new Error("Invalid order ID");
  }
  try {
    await fetch("/api/submit", {
      method: "POST",
      body: JSON.stringify(order),
    });
  } catch (error) {}
}
