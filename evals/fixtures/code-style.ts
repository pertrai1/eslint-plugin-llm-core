interface Order {
  id: string;
  total: number;
  isValid: boolean;
  isEnabled: boolean;
}

interface ProcessedOrder extends Order {
  processedAt: Date;
}

export const formatOrder = (order: Order): string => {
  return `${order.id}: total ${order.total}`;
};

export function processValidOrder(order: Order): ProcessedOrder | undefined {
  if (order.isValid) {
    return {
      ...order,
      processedAt: new Date(),
    };
  }
}

export function shouldProcess(order: Order): boolean {
  if (order.isEnabled === true) {
    return order.isValid;
  }
  return false;
}

export async function saveOrder(order: Order): Promise<void> {
  try {
    await fetch("/api/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  } catch (err) {
    throw new Error("Failed to save order");
  }
}

export abstract class OrderProcessor {
  abstract process(order: Order): ProcessedOrder;

  validate(order: Order): boolean {
    return order.isValid;
  }
}
