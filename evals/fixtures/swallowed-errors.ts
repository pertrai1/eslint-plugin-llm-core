// Expected violations: ~10
// Rules triggered:
//   no-swallowed-errors (3): decodeWebhookPayload, persistAuditEvent, publishWebhook — console-only catch blocks (all console.*)
//   prefer-unknown-in-catch (2): decodeWebhookPayload, runWebhookJob — catch (error: any)
//   structured-logging (1): runWebhookJob — template literal in logger.error call
//   throw-error-objects (2): loadWebhookConfig (string), createWebhookError (object)
//   no-magic-numbers (2): loadWebhookConfig (3), runWebhookJob (500)
//
// Key challenge: the fixture mixes swallowed errors with nearby logging and rethrow
// patterns that should stay valid. The model has to preserve explicit outcomes while
// replacing console-only catches with real error handling.

interface WebhookPayload {
  id: string;
  eventType: string;
  attempts: number;
  body: Record<string, unknown>;
}

interface WebhookConfig {
  endpoint: string;
  maxAttempts: number;
}

const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    console.log(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    console.warn(message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    console.error(message, meta),
};

function loadWebhookConfig(name: string): WebhookConfig {
  if (name === "legacy") {
    throw "Legacy webhook config missing";
  }

  return {
    endpoint: `/internal/webhooks/${name}`,
    maxAttempts: 3,
  };
}

function decodeWebhookPayload(raw: string): WebhookPayload | null {
  try {
    return JSON.parse(raw) as WebhookPayload;
  } catch (error: any) {
    console.error(`Webhook decode failed for payload ${raw.length}`, error);
  }

  return null;
}

async function persistAuditEvent(payload: WebhookPayload): Promise<void> {
  try {
    await fetch("/internal/audit-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn(`Audit write failed for ${payload.id}`, error);
  }
}

function createWebhookError(payload: WebhookPayload): never {
  throw { payloadId: payload.id, message: "Webhook publish failed" };
}

async function publishWebhook(payload: WebhookPayload): Promise<void> {
  try {
    await fetch(`/internal/webhooks/${payload.eventType}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload.body),
    });
  } catch (error) {
    console.log(error);
    console.error(payload.id);
  }
}

export async function runWebhookJob(rawPayload: string): Promise<void> {
  const config = loadWebhookConfig("orders");
  const payload = decodeWebhookPayload(rawPayload);

  if (!payload) {
    return;
  }

  try {
    if (payload.attempts > config.maxAttempts) {
      createWebhookError(payload);
    }

    await persistAuditEvent(payload);
    await publishWebhook(payload);
    logger.info("Webhook processed", { payloadId: payload.id });
  } catch (error: any) {
    if (error.statusCode === 500) {
      logger.error(`Webhook failed permanently for ${payload.id}`);
      return;
    }

    logger.error("Webhook processing aborted", { payloadId: payload.id });
    throw new Error("Webhook job failed", { cause: error });
  }
}
