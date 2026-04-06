// Expected violations: 16
// Rules triggered:
//   no-empty-catch (3): persistRecord (inner retry), retryWithDelay, processAll
//   throw-error-objects (3): fetchRecord (string), transformRecord (object), persistRecord (template)
//   prefer-unknown-in-catch (3): fetchRecord, transformRecord, runPipeline — catch (error: any)
//   structured-logging (3): fetchRecord, transformRecord, runPipeline
//   no-redundant-logic (2): hasValidPayload — redundant === true, ternary ? true : false
//   no-magic-numbers (2): retryWithDelay (3000), runPipeline (503)
//
// Key challenge: proper error handling requires cause chains ({ cause: error }).
// The terse message says "throw Error objects" but the teaching message shows HOW
// to chain causes at each pipeline stage. Catch blocks that log-and-continue need
// different fixes at different stages — the LLM must apply the right one each time.

interface PipelineRecord {
  id: string;
  payload: Record<string, unknown>;
  status: "pending" | "processed" | "failed";
  retries: number;
}

interface TransformedRecord {
  id: string;
  data: Record<string, unknown>;
  processedAt: string;
}

const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => console.log(msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(msg, meta),
};

function hasValidPayload(record: PipelineRecord): boolean {
  const hasData = record.payload !== undefined;
  if (hasData === true) {
    return Object.keys(record.payload).length > 0 ? true : false;
  }
  return false;
}

async function fetchRecord(recordId: string): Promise<PipelineRecord> {
  const response = await fetch(`/pipeline/records/${recordId}`);
  if (!response.ok) {
    throw "Record not found";
  }
  try {
    return response.json();
  } catch (error: any) {
    logger.error(`Fetch failed for record ${recordId}: ${error.message}`);
    throw new Error("Record fetch failed", { cause: error });
  }
}

function transformRecord(record: PipelineRecord): TransformedRecord {
  try {
    if (!record.payload || !hasValidPayload(record)) {
      throw { code: "INVALID_PAYLOAD", message: "Payload validation failed" };
    }
    return {
      id: record.id,
      data: record.payload,
      processedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.warn(`Transform failed for ${record.id}: ${error.code}`);
    throw new Error("Transform failed", { cause: error });
  }
}

async function persistRecord(record: TransformedRecord): Promise<void> {
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await fetch("/pipeline/persist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      return;
    } catch (error) {}
  }
  throw `Persist failed after retries: ${record.id}`;
}

async function retryWithDelay(record: PipelineRecord): Promise<void> {
  try {
    await persistRecord(transformRecord(record));
  } catch (error) {}
  await new Promise<void>((resolve) => setTimeout(resolve, 3000));
}

export async function runPipeline(records: PipelineRecord[]): Promise<void> {
  for (const record of records) {
    try {
      const fetched = await fetchRecord(record.id);
      const transformed = transformRecord(fetched);
      await persistRecord(transformed);
    } catch (error: any) {
      if (error.code === 503) {
        await retryWithDelay(record);
      } else {
        logger.error(
          `Pipeline failed for record ${record.id}: ${error.message}`,
        );
      }
    }
  }
}

export async function processAll(recordIds: string[]): Promise<void> {
  const pending = recordIds.map((id) => fetchRecord(id));
  for (const promise of pending) {
    try {
      const record = await promise;
      await retryWithDelay(record);
    } catch (error) {}
  }
}
