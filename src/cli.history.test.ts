import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseHistoryArgs, runHistoryCommand } from './cli.history';
import { appendHistoryEntry, createHistoryEntry } from './history';

function tmpFile(): string {
  return path.join(os.tmpdir(), `envchain-cli-history-${Date.now()}.json`);
}

describe('parseHistoryArgs', () => {
  it('parses --stage and --action', () => {
    const args = parseHistoryArgs(['--stage', 'prod', '--action', 'load']);
    expect(args.stage).toBe('prod');
    expect(args.action).toBe('load');
  });

  it('parses --limit and --json', () => {
    const args = parseHistoryArgs(['--limit', '5', '--json']);
    expect(args.limit).toBe(5);
    expect(args.json).toBe(true);
  });

  it('parses short flags', () => {
    const args = parseHistoryArgs(['-s', 'dev', '-n', '3', '-f', 'my.json']);
    expect(args.stage).toBe('dev');
    expect(args.limit).toBe(3);
    expect(args.file).toBe('my.json');
  });

  it('returns empty args for no input', () => {
    const args = parseHistoryArgs([]);
    expect(args.stage).toBeUndefined();
    expect(args.json).toBeUndefined();
  });
});

describe('runHistoryCommand', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('prints no history message when file is empty', () => {
    const f = tmpFile();
    runHistoryCommand(['--file', f]);
    expect(logSpy).toHaveBeenCalledWith('No history entries found.');
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  it('prints formatted entries', () => {
    const f = tmpFile();
    appendHistoryEntry(createHistoryEntry('dev', 'load', ['PORT'], 'abc'), f);
    appendHistoryEntry(createHistoryEntry('prod', 'export', ['DB_URL'], 'def'), f);
    runHistoryCommand(['--file', f]);
    expect(logSpy).toHaveBeenCalledTimes(2);
    fs.unlinkSync(f);
  });

  it('respects --limit', () => {
    const f = tmpFile();
    for (let i = 0; i < 5; i++) {
      appendHistoryEntry(createHistoryEntry('dev', 'load', [`K${i}`], `h${i}`), f);
    }
    runHistoryCommand(['--file', f, '--limit', '2']);
    expect(logSpy).toHaveBeenCalledTimes(2);
    fs.unlinkSync(f);
  });

  it('outputs JSON when --json flag is set', () => {
    const f = tmpFile();
    appendHistoryEntry(createHistoryEntry('staging', 'export', ['X'], 'zzz'), f);
    runHistoryCommand(['--file', f, '--json']);
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].stage).toBe('staging');
    fs.unlinkSync(f);
  });
});
