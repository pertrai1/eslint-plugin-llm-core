// Expected violations: ~14
// Rules triggered:
//   no-exported-function-expressions (2): loadConfig, validateConfig
//   explicit-export-types (3): loadConfig (return), validateConfig (return), getConfigValue (return)
//   no-redundant-logic (2): "config.debug === true" in validateConfig, "inRange ? true : false" in isValidPort
//   structured-logging (2): template literals in validateConfig and loadConfig
//   no-magic-numbers (2): 8080 (default port), 30 (default timeout)
//   prefer-unknown-in-catch (1): catch (err: any) in loadConfig
//   no-empty-catch (1): empty catch in parseEnvOverrides
//   consistent-catch-param-name (1): catch (e) in parseEnvOverrides, inconsistent with catch (err) in loadConfig
//
// Key challenge: arrow-to-declaration conversion must happen simultaneously with
// adding type annotations. Redundant boolean logic is interleaved with validation
// control flow. Teaching messages show the exact combined transformations.

declare const process: { env: Record<string, string | undefined> };

interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  ssl: boolean;
}

interface AppConfig {
  env: string;
  port: number;
  timeout: number;
  database: DatabaseConfig;
  debug: boolean;
}

type ValidationResult = {
  valid: boolean;
  errors: string[];
};

const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => console.log(msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(msg, meta),
};

const DB_PORT = 5432;
const MAX_PORT = 65535;

const DEFAULT_CONFIG: AppConfig = {
  env: "development",
  port: 8080,
  timeout: 30,
  database: { host: "localhost", port: DB_PORT, name: "app", ssl: false },
  debug: false,
};

function parseEnvOverrides(base: AppConfig): AppConfig {
  const config = { ...base };
  try {
    const rawPort = process.env["PORT"];
    if (rawPort !== undefined) {
      const parsed = Number(rawPort);
      if (!isNaN(parsed)) {
        config.port = parsed;
      }
    }
  } catch (e) {}
  return config;
}

function isValidPort(port: number): boolean {
  const inRange = port > 0 && port <= MAX_PORT;
  return inRange ? true : false;
}

export const validateConfig = (config: AppConfig) => {
  const errors: string[] = [];

  if (!isValidPort(config.port)) {
    errors.push("Invalid port: " + config.port);
  }

  if (!config.database.host) {
    errors.push("Database host is required");
  }

  if (config.debug === true) {
    logger.warn("Debug mode is enabled", { env: config.env });
  }

  if (errors.length > 0) {
    logger.warn(`Config validation failed with ${errors.length} error(s)`, {
      errors,
    });
  }

  return { valid: errors.length === 0, errors };
};

export const loadConfig = (overrides?: Partial<AppConfig>) => {
  logger.info(`Loading config for environment: ${DEFAULT_CONFIG.env}`, {
    overrides,
  });

  let config: AppConfig = { ...DEFAULT_CONFIG, ...overrides };
  config = parseEnvOverrides(config);

  try {
    const result = validateConfig(config);
    if (!result.valid) {
      logger.error("Config validation failed", { errors: result.errors });
    }
    return config;
  } catch (err: any) {
    logger.error("Unexpected error loading config", { message: err.message });
    return DEFAULT_CONFIG;
  }
};

export function getConfigValue<K extends keyof AppConfig>(key: K) {
  return loadConfig()[key];
}
