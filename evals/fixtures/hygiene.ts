interface Config {
  maxRetries: number;
  baseUrl: string;
}

// eslint-disable-next-line no-console
function debugLog(message: string): void {
  console.log(message);
}

export async function fetchWithRetry(
  url: string,
  config: Config,
): Promise<unknown> {
  // TODO: add request timeout support

  // const cached = requestCache.get(url);
  // if (cached) return cached;

  let retries = 0;

  while (retries < config.maxRetries) {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      retries++;
      if (retries >= config.maxRetries) {
        throw error;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error("Max retries exceeded");
}

export function buildUrl(base: string, path: string): string {
  debugLog(`Building URL: ${base}${path}`);
  return `${base}${path}`;
}
