/**
 * transformer.ts
 * Applies transformation rules to env map values (trim, uppercase keys, lowercase values, etc.)
 */

import { EnvMap } from './types';

export type TransformRule =
  | 'trim'
  | 'uppercase-keys'
  | 'lowercase-keys'
  | 'lowercase-values'
  | 'uppercase-values'
  | 'remove-empty';

export interface TransformOptions {
  rules: TransformRule[];
}

export function applyRule(key: string, value: string, rule: TransformRule): { key: string; value: string } | null {
  switch (rule) {
    case 'trim':
      return { key: key.trim(), value: value.trim() };
    case 'uppercase-keys':
      return { key: key.toUpperCase(), value };
    case 'lowercase-keys':
      return { key: key.toLowerCase(), value };
    case 'uppercase-values':
      return { key, value: value.toUpperCase() };
    case 'lowercase-values':
      return { key, value: value.toLowerCase() };
    case 'remove-empty':
      return value.trim() === '' ? null : { key, value };
    default:
      return { key, value };
  }
}

export function transformEnvMap(envMap: EnvMap, options: TransformOptions): EnvMap {
  const { rules } = options;
  const result: EnvMap = {};

  for (const [origKey, origValue] of Object.entries(envMap)) {
    let current: { key: string; value: string } | null = { key: origKey, value: origValue };

    for (const rule of rules) {
      if (current === null) break;
      current = applyRule(current.key, current.value, rule);
    }

    if (current !== null) {
      result[current.key] = current.value;
    }
  }

  return result;
}
