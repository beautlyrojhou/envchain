import { EnvMap } from './types';

export interface DeduplicateOptions {
  strategy?: 'first' | 'last';
  caseSensitive?: boolean;
}

export interface DeduplicateResult {
  env: EnvMap;
  duplicates: Array<{ key: string; values: string[]; kept: string }>;
}

/**
 * Finds all keys that appear more than once (case-insensitive if specified).
 */
export function findDuplicateKeys(
  entries: Array<[string, string]>,
  caseSensitive: boolean
): Map<string, string[]> {
  const seen = new Map<string, string[]>();

  for (const [key, value] of entries) {
    const normalizedKey = caseSensitive ? key : key.toUpperCase();
    const existing = seen.get(normalizedKey) ?? [];
    existing.push(value);
    seen.set(normalizedKey, existing);
  }

  const duplicates = new Map<string, string[]>();
  for (const [key, values] of seen.entries()) {
    if (values.length > 1) {
      duplicates.set(key, values);
    }
  }

  return duplicates;
}

/**
 * Deduplicates an EnvMap, keeping either the first or last occurrence of each key.
 * Returns the deduplicated map and a report of removed duplicates.
 */
export function deduplicateEnvMap(
  env: EnvMap,
  options: DeduplicateOptions = {}
): DeduplicateResult {
  const { strategy = 'last', caseSensitive = true } = options;
  const entries = Object.entries(env);
  const seen = new Map<string, { originalKey: string; value: string }>();
  const duplicates: DeduplicateResult['duplicates'] = [];
  const allValues = new Map<string, string[]>();

  for (const [key, value] of entries) {
    const normalizedKey = caseSensitive ? key : key.toUpperCase();
    const bucket = allValues.get(normalizedKey) ?? [];
    bucket.push(value);
    allValues.set(normalizedKey, bucket);

    if (strategy === 'first' && seen.has(normalizedKey)) {
      continue;
    }
    seen.set(normalizedKey, { originalKey: key, value });
  }

  for (const [normalizedKey, values] of allValues.entries()) {
    if (values.length > 1) {
      const kept = seen.get(normalizedKey)!.value;
      duplicates.push({ key: normalizedKey, values, kept });
    }
  }

  const result: EnvMap = {};
  for (const { originalKey, value } of seen.values()) {
    result[originalKey] = value;
  }

  return { env: result, duplicates };
}

/**
 * Formats a human-readable summary of deduplicated keys.
 */
export function formatDeduplicateSummary(
  result: DeduplicateResult
): string {
  if (result.duplicates.length === 0) {
    return 'No duplicate keys found.';
  }
  const lines = [`Found ${result.duplicates.length} duplicate key(s):`, ''];
  for (const { key, values, kept } of result.duplicates) {
    lines.push(`  ${key}: [${values.map(v => JSON.stringify(v)).join(', ')}] → kept ${JSON.stringify(kept)}`);
  }
  return lines.join('\n');
}
