import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createHistoryEntry,
  loadHistory,
  saveHistory,
  appendHistoryEntry,
  filterHistory,
  formatHistoryEntry,
  HistoryLog,
} from './history';

function tmpFile(): string {
  return path.join(os.tmpdir(), `envchain-history-test-${Date.now()}.json`);
}

describe('createHistoryEntry', () => {
  it('creates an entry with all fields', () => {
    const entry = createHistoryEntry('production', 'load', ['DB_URL', 'API_KEY'], 'abc123');
    expect(entry.stage).toBe('production');
    expect(entry.action).toBe('load');
    expect(entry.keys).toEqual(['DB_URL', 'API_KEY']);
    expect(entry.checksum).toBe('abc123');
    expect(entry.timestamp).toBeTruthy();
  });
});

describe('loadHistory', () => {
  it('returns empty log for missing file', () => {
    const log = loadHistory('/nonexistent/path.json');
    expect(log.entries).toEqual([]);
  });

  it('returns empty log for invalid JSON', () => {
    const f = tmpFile();
    fs.writeFileSync(f, 'not json');
    const log = loadHistory(f);
    expect(log.entries).toEqual([]);
    fs.unlinkSync(f);
  });
});

describe('saveHistory and loadHistory', () => {
  it('round-trips a history log', () => {
    const f = tmpFile();
    const log: HistoryLog = {
      entries: [createHistoryEntry('staging', 'export', ['PORT'], 'xyz')],
    };
    saveHistory(log, f);
    const loaded = loadHistory(f);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].stage).toBe('staging');
    fs.unlinkSync(f);
  });
});

describe('appendHistoryEntry', () => {
  it('appends entries to the log', () => {
    const f = tmpFile();
    appendHistoryEntry(createHistoryEntry('dev', 'load', ['A'], 'h1'), f);
    appendHistoryEntry(createHistoryEntry('dev', 'export', ['B'], 'h2'), f);
    const log = loadHistory(f);
    expect(log.entries).toHaveLength(2);
    fs.unlinkSync(f);
  });
});

describe('filterHistory', () => {
  const entries = [
    createHistoryEntry('dev', 'load', ['A'], 'h1'),
    createHistoryEntry('prod', 'export', ['B'], 'h2'),
    createHistoryEntry('dev', 'export', ['C'], 'h3'),
  ];
  const log: HistoryLog = { entries };

  it('filters by stage', () => {
    expect(filterHistory(log, 'dev')).toHaveLength(2);
  });

  it('filters by action', () => {
    expect(filterHistory(log, undefined, 'export')).toHaveLength(2);
  });

  it('filters by both', () => {
    expect(filterHistory(log, 'dev', 'export')).toHaveLength(1);
  });
});

describe('formatHistoryEntry', () => {
  it('formats an entry as a readable string', () => {
    const entry = createHistoryEntry('prod', 'load', ['DB_URL'], 'checkABC');
    const line = formatHistoryEntry(entry);
    expect(line).toContain('prod');
    expect(line).toContain('load');
    expect(line).toContain('DB_URL');
    expect(line).toContain('checkABC');
  });

  it('shows (none) when no keys', () => {
    const entry = createHistoryEntry('dev', 'load', [], 'empty');
    expect(formatHistoryEntry(entry)).toContain('(none)');
  });
});
