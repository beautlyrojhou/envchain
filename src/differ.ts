import { EnvMap } from './types';

export type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export interface EnvDiffEntry {
  key: string;
  status: DiffStatus;
  oldValue?: string;
  newValue?: string;
}

export interface EnvDiff {
  entries: EnvDiffEntry[];
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
}

export function diffEnvMaps(base: EnvMap, target: EnvMap): EnvDiff {
  const entries: EnvDiffEntry[] = [];
  const allKeys = new Set([...Object.keys(base), ...Object.keys(target)]);

  for (const key of Array.from(allKeys).sort()) {
    const inBase = Object.prototype.hasOwnProperty.call(base, key);
    const inTarget = Object.prototype.hasOwnProperty.call(target, key);

    if (inBase && !inTarget) {
      entries.push({ key, status: 'removed', oldValue: base[key] });
    } else if (!inBase && inTarget) {
      entries.push({ key, status: 'added', newValue: target[key] });
    } else if (base[key] !== target[key]) {
      entries.push({ key, status: 'changed', oldValue: base[key], newValue: target[key] });
    } else {
      entries.push({ key, status: 'unchanged', oldValue: base[key], newValue: target[key] });
    }
  }

  return {
    entries,
    added: entries.filter(e => e.status === 'added').length,
    removed: entries.filter(e => e.status === 'removed').length,
    changed: entries.filter(e => e.status === 'changed').length,
    unchanged: entries.filter(e => e.status === 'unchanged').length,
  };
}

export function formatDiff(diff: EnvDiff, showUnchanged = false): string {
  const lines: string[] = [];

  for (const entry of diff.entries) {
    if (entry.status === 'unchanged' && !showUnchanged) continue;

    switch (entry.status) {
      case 'added':
        lines.push(`+ ${entry.key}=${entry.newValue ?? ''}`);
        break;
      case 'removed':
        lines.push(`- ${entry.key}=${entry.oldValue ?? ''}`);
        break;
      case 'changed':
        lines.push(`~ ${entry.key}: ${entry.oldValue ?? ''} -> ${entry.newValue ?? ''}`);
        break;
      case 'unchanged':
        lines.push(`  ${entry.key}=${entry.oldValue ?? ''}`);
        break;
    }
  }

  lines.push(`\nSummary: +${diff.added} added, -${diff.removed} removed, ~${diff.changed} changed, ${diff.unchanged} unchanged`);
  return lines.join('\n');
}
