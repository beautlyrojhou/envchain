import { EnvMap } from './types';

export interface TemplateRenderOptions {
  strict?: boolean; // throw on missing keys
  fallback?: string; // default value for missing keys
}

/**
 * Renders a template string by replacing {{KEY}} placeholders with env values.
 */
export function renderTemplate(
  template: string,
  env: EnvMap,
  options: TemplateRenderOptions = {}
): string {
  const { strict = false, fallback = '' } = options;

  return template.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    if (key in env) {
      return env[key] ?? fallback;
    }
    if (strict) {
      throw new Error(`Template key not found in env: ${key}`);
    }
    return fallback;
  });
}

/**
 * Renders all values in an EnvMap as templates against the same map.
 * Useful for self-referential env configs.
 */
export function renderEnvTemplate(
  env: EnvMap,
  options: TemplateRenderOptions = {}
): EnvMap {
  const result: EnvMap = {};
  for (const [key, value] of Object.entries(env)) {
    result[key] = value != null ? renderTemplate(value, env, options) : value;
  }
  return result;
}

/**
 * Extracts all placeholder keys referenced in a template string.
 */
export function extractTemplateKeys(template: string): string[] {
  const matches = [...template.matchAll(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g)];
  return [...new Set(matches.map((m) => m[1]))];
}
