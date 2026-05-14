import { WatchEvent } from './watcher';
import { diffEnvMaps, formatDiff } from './differ';
import { EnvMap } from './types';

export interface ReportOptions {
  redact?: boolean;
  format?: 'text' | 'json';
}

export interface ChangeReport {
  file: string;
  timestamp: string;
  added: string[];
  removed: string[];
  modified: string[];
  raw?: string;
}

export function buildChangeReport(
  event: WatchEvent,
  options: ReportOptions = {}
): ChangeReport {
  const { previous, current, file, timestamp } = event;
  const diffs = diffEnvMaps(previous, current);

  const added = diffs.filter((d) => d.type === 'added').map((d) => d.key);
  const removed = diffs.filter((d) => d.type === 'removed').map((d) => d.key);
  const modified = diffs.filter((d) => d.type === 'changed').map((d) => d.key);

  const report: ChangeReport = {
    file,
    timestamp: timestamp.toISOString(),
    added,
    removed,
    modified,
  };

  if (options.format === 'text') {
    report.raw = formatDiff(diffs, { redact: options.redact });
  }

  return report;
}

export function printChangeReport(report: ChangeReport): void {
  console.log(`[envchain:watch] ${report.timestamp} — ${report.file}`);
  if (report.added.length) console.log(`  + added:    ${report.added.join(', ')}`);
  if (report.removed.length) console.log(`  - removed:  ${report.removed.join(', ')}`);
  if (report.modified.length) console.log(`  ~ modified: ${report.modified.join(', ')}`);
  if (report.raw) console.log(report.raw);
}
