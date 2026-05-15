/**
 * exportSchema.sort.ts — Schema and summary utilities for sort output
 */

import { SortOptions } from './sorter';

export interface SortSummary {
  totalKeys: number;
  prefixes: string[];
  order: string;
  grouped: boolean;
}

export function buildSortSchema(options: SortOptions): Record<string, unknown> {
  return {
    type: 'object',
    description: 'Sorted environment variable map',
    properties: {
      order: { type: 'string', enum: ['asc', 'desc'], default: options.order ?? 'asc' },
      groupByPrefix: { type: 'boolean', default: options.groupByPrefix ?? false },
      prefixDelimiter: { type: 'string', default: options.prefixDelimiter ?? '_' },
    },
  };
}

export function summarizeSortResult(
  env: Record<string, string>,
  prefixes: string[],
  options: SortOptions
): SortSummary {
  return {
    totalKeys: Object.keys(env).length,
    prefixes,
    order: options.order ?? 'asc',
    grouped: options.groupByPrefix ?? false,
  };
}

export function formatSortSummary(summary: SortSummary): string {
  const lines: string[] = [
    `Keys   : ${summary.totalKeys}`,
    `Order  : ${summary.order}`,
    `Grouped: ${summary.grouped}`,
  ];
  if (summary.prefixes.length > 0) {
    lines.push(`Prefixes: ${summary.prefixes.join(', ')}`);
  }
  return lines.join('\n');
}
