/**
 * sorter.ts — Sort and group environment variable maps
 */

export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  order?: SortOrder;
  groupByPrefix?: boolean;
  prefixDelimiter?: string;
}

export function sortEnvMap(
  env: Record<string, string>,
  options: SortOptions = {}
): Record<string, string> {
  const { order = 'asc', groupByPrefix = false, prefixDelimiter = '_' } = options;

  const keys = Object.keys(env);

  if (groupByPrefix) {
    const groups = groupKeysByPrefix(keys, prefixDelimiter);
    const sortedGroups = Object.keys(groups).sort((a, b) =>
      order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    );
    const result: Record<string, string> = {};
    for (const group of sortedGroups) {
      const groupKeys = groups[group].sort((a, b) =>
        order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
      );
      for (const key of groupKeys) {
        result[key] = env[key];
      }
    }
    return result;
  }

  const sortedKeys = keys.sort((a, b) =>
    order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
  );

  return Object.fromEntries(sortedKeys.map((k) => [k, env[k]]));
}

export function groupKeysByPrefix(
  keys: string[],
  delimiter = '_'
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const key of keys) {
    const idx = key.indexOf(delimiter);
    const prefix = idx !== -1 ? key.slice(0, idx) : key;
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(key);
  }
  return groups;
}

export function extractPrefixes(
  env: Record<string, string>,
  delimiter = '_'
): string[] {
  const prefixes = new Set<string>();
  for (const key of Object.keys(env)) {
    const idx = key.indexOf(delimiter);
    if (idx !== -1) prefixes.add(key.slice(0, idx));
  }
  return Array.from(prefixes).sort();
}
