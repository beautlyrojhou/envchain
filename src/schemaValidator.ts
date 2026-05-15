import { EnvMap } from './types';

export type FieldType = 'string' | 'number' | 'boolean' | 'url' | 'email';

export interface FieldSchema {
  type: FieldType;
  required?: boolean;
  default?: string;
  pattern?: RegExp;
  description?: string;
}

export type EnvSchema = Record<string, FieldSchema>;

export interface SchemaValidationResult {
  valid: boolean;
  missing: string[];
  typeErrors: { key: string; expected: FieldType; actual: string }[];
  patternErrors: { key: string; pattern: string }[];
}

const TYPE_PATTERNS: Record<FieldType, RegExp> = {
  string: /.*/,
  number: /^-?\d+(\.\d+)?$/,
  boolean: /^(true|false|1|0)$/i,
  url: /^https?:\/\/.+/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

export function validateSchema(
  env: EnvMap,
  schema: EnvSchema
): SchemaValidationResult {
  const missing: string[] = [];
  const typeErrors: SchemaValidationResult['typeErrors'] = [];
  const patternErrors: SchemaValidationResult['patternErrors'] = [];

  for (const [key, field] of Object.entries(schema)) {
    const raw = env[key] ?? field.default;

    if (raw === undefined || raw === '') {
      if (field.required !== false) missing.push(key);
      continue;
    }

    if (!TYPE_PATTERNS[field.type].test(raw)) {
      typeErrors.push({ key, expected: field.type, actual: typeof raw });
    }

    if (field.pattern && !field.pattern.test(raw)) {
      patternErrors.push({ key, pattern: field.pattern.toString() });
    }
  }

  return {
    valid: missing.length === 0 && typeErrors.length === 0 && patternErrors.length === 0,
    missing,
    typeErrors,
    patternErrors,
  };
}

export function applyDefaults(env: EnvMap, schema: EnvSchema): EnvMap {
  const result: EnvMap = { ...env };
  for (const [key, field] of Object.entries(schema)) {
    if ((result[key] === undefined || result[key] === '') && field.default !== undefined) {
      result[key] = field.default;
    }
  }
  return result;
}

export function formatSchemaReport(result: SchemaValidationResult): string {
  const lines: string[] = [];
  if (result.missing.length) lines.push(`Missing required keys: ${result.missing.join(', ')}`);
  for (const e of result.typeErrors) lines.push(`Type error [${e.key}]: expected ${e.expected}`);
  for (const e of result.patternErrors) lines.push(`Pattern mismatch [${e.key}]: ${e.pattern}`);
  return lines.length ? lines.join('\n') : 'Schema validation passed.';
}
