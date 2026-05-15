import * as fs from 'fs';
import * as path from 'path';

export interface HistoryEntry {
  timestamp: string;
  stage: string;
  action: string;
  keys: string[];
  checksum: string;
}

export interface HistoryLog {
  entries: HistoryEntry[];
}

const DEFAULT_HISTORY_FILE = '.envchain-history.json';

export function createHistoryEntry(
  stage: string,
  action: string,
  keys: string[],
  checksum: string
): HistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    stage,
    action,
    keys,
    checksum,
  };
}

export function loadHistory(filePath: string = DEFAULT_HISTORY_FILE): HistoryLog {
  if (!fs.existsSync(filePath)) {
    return { entries: [] };
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as HistoryLog;
  } catch {
    return { entries: [] };
  }
}

export function saveHistory(log: HistoryLog, filePath: string = DEFAULT_HISTORY_FILE): void {
  fs.writeFileSync(filePath, JSON.stringify(log, null, 2), 'utf-8');
}

export function appendHistoryEntry(
  entry: HistoryEntry,
  filePath: string = DEFAULT_HISTORY_FILE
): HistoryLog {
  const log = loadHistory(filePath);
  log.entries.push(entry);
  saveHistory(log, filePath);
  return log;
}

export function filterHistory(
  log: HistoryLog,
  stage?: string,
  action?: string
): HistoryEntry[] {
  return log.entries.filter((e) => {
    if (stage && e.stage !== stage) return false;
    if (action && e.action !== action) return false;
    return true;
  });
}

export function formatHistoryEntry(entry: HistoryEntry): string {
  const keyList = entry.keys.length > 0 ? entry.keys.join(', ') : '(none)';
  return `[${entry.timestamp}] ${entry.stage} | ${entry.action} | keys: ${keyList} | checksum: ${entry.checksum}`;
}
