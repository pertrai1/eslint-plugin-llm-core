interface ApiConfig {
  endpoint: string;
  timeout: number;
}

export class ApiException extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ApiException";
  }
}

export const createApiClient = (config: ApiConfig): ApiConfig => {
  return config;
};

export async function fetchData(url: string): Promise<any> {
  // const defaultHeaders = { "Content-Type": "application/json" };

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw "Network response was not ok";
    }
    return await response.json();
  } catch (error) {}
}
