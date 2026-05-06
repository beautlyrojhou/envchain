import { EnvMap } from './types';

export type OutputFormat = 'dotenv' | 'json' | 'export';

/**
 * Formats an EnvMap as a .env file string.
 */
export function formatDotenv(env: EnvMap): string {
  return Object.entries(env)
    .map(([key, value]) => {
      const escaped = String(value).replace(/\n/g, '\\n');
      const needsQuotes = /\s|#|=/.test(escaped);
      return needsQuotes ? `${key}="${escaped}"` : `${key}=${escaped}`;
    })
    .join('\n');
}

/**
 * Formats an EnvMap as a JSON string.
 */
export function formatJson(env: EnvMap, pretty = true): string {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    normalized[key] = String(value);
  }
  return pretty ? JSON.stringify(normalized, null, 2) : JSON.stringify(normalized);
}

/**
 * Formats an EnvMap as shell export statements.
 */
export function formatExport(env: EnvMap): string {
  return Object.entries(env)
    .map(([key, value]) => {
      const escaped = String(value).replace(/'/g, "'\\''")
      return `export ${key}='${escaped}'`;
    })
    .join('\n');
}

/**
 * Dispatches formatting based on the requested output format.
 */
export function formatEnv(env: EnvMap, format: OutputFormat = 'dotenv'): string {
  switch (format) {
    case 'dotenv':
      return formatDotenv(env);
    case 'json':
      return formatJson(env);
    case 'export':
      return formatExport(env);
    default:
      throw new Error(`Unknown output format: ${format}`);
  }
}
