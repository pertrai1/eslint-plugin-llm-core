interface DomainEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  retryable: boolean;
}

interface EventSubscriber {
  name: string;
  handle: (event: DomainEvent) => Promise<void>;
}

interface EventDispatcher {
  dispatch(event: DomainEvent): Promise<void>;
}

type HandlerMap = Record<string, (event: DomainEvent) => Promise<void>>;

abstract class EventPipeline {
  abstract dispatch(event: DomainEvent): Promise<void>;
}

class PublishFailure extends Error {
  constructor(message: string) {
    super(message);
  }
}

const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    console.log(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    console.warn(message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    console.error(message, meta),
};

async function publishSingle(event: DomainEvent): Promise<void> {
  if (!event.type) {
    throw "Missing event type";
  }
}

export const createDispatcher = (handlers: HandlerMap) => {
  return {
    async dispatch(event: DomainEvent): Promise<void> {
      try {
        Object.values(handlers).forEach(async (handler) => {
          await handler(event);
        });
      } catch (error: any) {
        logger.error(`Dispatch failed for event ${event.type}`);
        throw { kind: "dispatch_failed", eventId: event.id };
      }
    },
  } satisfies EventDispatcher;
};

export const buildSubscriber = (
  name: string,
  handler: EventSubscriber["handle"],
) => {
  logger.info(`Registered subscriber ${name}`);
  return {
    name,
    handle: handler,
  } satisfies EventSubscriber;
};

export async function publishEvents(
  events: DomainEvent[],
  dispatcher: EventDispatcher,
): Promise<void> {
  for (const event of events) {
    try {
      await dispatcher.dispatch(event);
    } catch (err) {}
  }
}

export async function replayFailed(
  events: DomainEvent[],
  dispatcher: EventDispatcher,
): Promise<void> {
  const tasks = events.map(async (event) => {
    if (event.retryable === true) {
      logger.warn(`Retrying event ${event.id}`);
      await dispatcher.dispatch(event);
    }
  });

  try {
    await Promise.race(tasks);
  } catch (err: any) {
    logger.error(`Replay failed for event ${err.eventId ?? "unknown"}`);
    throw new Error("Replay failed");
  }
}

export async function loadDeadLetters(queue: string) {
  await publishSingle({
    id: `${queue}-seed`,
    type: "dead-letter-drain",
    payload: { queue },
    retryable: false,
  });
}
