import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseCompareArgs, runCompareCommand } from './cli.compare';

function tmpEnvFile(content: string): string {
  const p = path.join(os.tmpdir(), `envchain-compare-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('parseCompareArgs', () => {
  it('parses two file arguments', () => {
    const args = parseCompareArgs(['node', 'cli', 'a.env', 'b.env']);
    expect(args.fileA).toBe('a.env');
    expect(args.fileB).toBe('b.env');
    expect(args.format).toBe('text');
    expect(args.redact).toBe(false);
  });

  it('parses --json flag', () => {
    const args = parseCompareArgs(['node', 'cli', 'a.env', 'b.env', '--json']);
    expect(args.format).toBe('json');
  });

  it('parses --redact flag', () => {
    const args = parseCompareArgs(['node', 'cli', 'a.env', 'b.env', '--redact']);
    expect(args.redact).toBe(true);
  });

  it('exits when fewer than 2 files provided', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => parseCompareArgs(['node', 'cli', 'a.env'])).toThrow('exit');
    mockExit.mockRestore();
  });
});

describe('runCompareCommand', () => {
  it('exits 0 when files are identical', async () => {
    const content = 'A=1\nB=2\n';
    const f1 = tmpEnvFile(content);
    const f2 = tmpEnvFile(content);
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await expect(runCompareCommand(['node', 'cli', f1, f2])).resolves.toBeUndefined();
    spy.mockRestore();
    mockExit.mockRestore();
    fs.unlinkSync(f1);
    fs.unlinkSync(f2);
  });

  it('exits 1 when files differ', async () => {
    const f1 = tmpEnvFile('A=1\n');
    const f2 = tmpEnvFile('A=2\n');
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => { throw new Error(`exit:${code}`); });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await expect(runCompareCommand(['node', 'cli', f1, f2])).rejects.toThrow('exit:1');
    mockExit.mockRestore();
    fs.unlinkSync(f1);
    fs.unlinkSync(f2);
  });

  it('outputs JSON when --json flag is set', async () => {
    const content = 'X=hello\n';
    const f1 = tmpEnvFile(content);
    const f2 = tmpEnvFile(content);
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((msg) => logs.push(msg));
    await runCompareCommand(['node', 'cli', f1, f2, '--json']);
    const parsed = JSON.parse(logs[0]);
    expect(parsed).toHaveProperty('score', 100);
    fs.unlinkSync(f1);
    fs.unlinkSync(f2);
  });
});
