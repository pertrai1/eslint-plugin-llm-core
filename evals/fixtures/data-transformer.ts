interface RawTransformRecord {
  id: string;
  value: string | number | null;
  metadata: unknown;
  source: string;
  active: boolean;
}

interface NormalizedRecord {
  id: string;
  value: number;
  status: string;
  source: string;
  tags: string[];
}

const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    console.log(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    console.warn(message, meta),
};

function isRecordMetadata(value: unknown): value is {
  status?: string;
  tags?: string[];
} {
  return typeof value === "object" && value !== null;
}

function hasActiveTransforms(records: RawTransformRecord[]): boolean {
  const hasActive = records.some((record) => record.active) ? true : false;
  if (hasActive === true) {
    return true;
  }
  return false;
}

export const parseMetadata = (payload: unknown) => {
  logger.warn(`Parsing transform metadata for ${String(payload)}`);
  return payload as any;
};

function buildLookup(rows: Array<any>): Record<string, any> {
  const lookup: Record<string, any> = {};

  for (const row of rows) {
    lookup[(row as any).id] = row;
  }

  return lookup;
}

async function shouldKeepRecord(record: RawTransformRecord): Promise<boolean> {
  return record.active && record.value !== null;
}

export async function normalizeBatch(
  records: RawTransformRecord[],
  source: string,
): Promise<NormalizedRecord[]> {
  const eligible = records.filter(async (record) => {
    return await shouldKeepRecord(record);
  });

  const mapped = eligible.map(async (record) => {
    const metadata = parseMetadata(record.metadata);
    logger.info(`Normalized record ${record.id} from ${source}`);

    return {
      id: record.id,
      value: Number(record.value ?? 0),
      status: (metadata as any).status ?? "pending",
      source,
      tags:
        isRecordMetadata(metadata) && Array.isArray(metadata.tags)
          ? metadata.tags
          : [],
    } satisfies NormalizedRecord;
  });

  return mapped as any;
}

function shouldFlush(records: NormalizedRecord[]): boolean {
  if (records.length > 10) {
    return true;
  } else {
    return false;
  }
}

export function persistBatch(records: NormalizedRecord[]) {
  const lookup = buildLookup(records);

  if (
    shouldFlush(records) &&
    hasActiveTransforms(records as unknown as RawTransformRecord[])
  ) {
    logger.info(`Persisting ${records.length} normalized records`);
  }

  return Object.keys(lookup).reduce<Record<string, number>>((acc, key) => {
    acc[key] = key.length;
    return acc;
  }, {});
}

export async function loadTransforms(source: string) {
  const response = await fetch(`/transforms/${source}`);
  return response.json();
}
