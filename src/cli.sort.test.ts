import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseSortArgs, runSortCommand } from './cli.sort';

function tmpEnvFile(content: string): string {
  const file = path.join(os.tmpdir(), `sort-test-${Date.now()}.env`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('parseSortArgs', () => {
  it('parses file positional', () => {
    const args = parseSortArgs(['.env']);
    expect(args.file).toBe('.env');
  });

  it('parses --order flag', () => {
    const args = parseSortArgs(['.env', '--order', 'desc']);
    expect(args.order).toBe('desc');
  });

  it('parses --group-by-prefix flag', () => {
    const args = parseSortArgs(['.env', '--group-by-prefix']);
    expect(args.groupByPrefix).toBe(true);
  });

  it('parses --delimiter flag', () => {
    const args = parseSortArgs(['.env', '--delimiter', '.']);
    expect(args.delimiter).toBe('.');
  });

  it('parses --list-prefixes flag', () => {
    const args = parseSortArgs(['.env', '--list-prefixes']);
    expect(args.listPrefixes).toBe(true);
  });

  it('parses --output flag', () => {
    const args = parseSortArgs(['.env', '--output', 'out.env']);
    expect(args.output).toBe('out.env');
  });
});

describe('runSortCommand', () => {
  let tmpFile: string;
  let outFile: string;

  beforeEach(() => {
    tmpFile = tmpEnvFile('ZEBRA=z\nAPP_NAME=envchain\nDB_HOST=localhost\n');
    outFile = path.join(os.tmpdir(), `sort-out-${Date.now()}.env`);
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
  });

  it('writes sorted output to file', () => {
    runSortCommand([tmpFile, '--output', outFile]);
    const content = fs.readFileSync(outFile, 'utf-8');
    const keys = content.match(/^[A-Z_]+(?==)/gm) ?? [];
    expect(keys).toEqual([...keys].sort());
  });

  it('writes descending sorted output to file', () => {
    runSortCommand([tmpFile, '--order', 'desc', '--output', outFile]);
    const content = fs.readFileSync(outFile, 'utf-8');
    const keys = content.match(/^[A-Z_]+(?==)/gm) ?? [];
    expect(keys).toEqual([...keys].sort().reverse());
  });

  it('writes grouped output to file', () => {
    runSortCommand([tmpFile, '--group-by-prefix', '--output', outFile]);
    expect(fs.existsSync(outFile)).toBe(true);
  });
});
