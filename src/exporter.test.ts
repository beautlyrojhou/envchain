import { renderEnv, exportEnv, exportEnvToString } from './exporter';
import { EnvMap } from './types';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const sampleEnv: EnvMap = new Map([
  ['APP_NAME', 'envchain'],
  ['PORT', '3000'],
  ['DEBUG', 'false'],
]);

describe('renderEnv', () => {
  it('renders dotenv format', () => {
    const out = renderEnv(sampleEnv, { format: 'dotenv' });
    expect(out).toContain('APP_NAME=envchain');
    expect(out).toContain('PORT=3000');
  });

  it('renders json format', () => {
    const out = renderEnv(sampleEnv, { format: 'json' });
    const parsed = JSON.parse(out);
    expect(parsed.APP_NAME).toBe('envchain');
    expect(parsed.PORT).toBe('3000');
  });

  it('renders json pretty format', () => {
    const out = renderEnv(sampleEnv, { format: 'json', pretty: true });
    expect(out).toContain('\n');
  });

  it('renders export format', () => {
    const out = renderEnv(sampleEnv, { format: 'export' });
    expect(out).toContain('export APP_NAME=');
  });

  it('renders raw format', () => {
    const out = renderEnv(sampleEnv, { format: 'raw' });
    expect(out).toContain('APP_NAME');
  });

  it('throws on unknown format', () => {
    expect(() => renderEnv(sampleEnv, { format: 'xml' as any })).toThrow();
  });
});

describe('exportEnv', () => {
  it('writes to file', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-'));
    const outFile = path.join(tmpDir, 'out', '.env');
    exportEnv(sampleEnv, { format: 'dotenv', outputPath: outFile });
    const content = fs.readFileSync(outFile, 'utf-8');
    expect(content).toContain('APP_NAME=envchain');
    fs.rmSync(tmpDir, { recursive: true });
  });
});

describe('exportEnvToString', () => {
  it('returns string for dotenv', () => {
    const result = exportEnvToString(sampleEnv, 'dotenv');
    expect(typeof result).toBe('string');
    expect(result).toContain('DEBUG=false');
  });
});
