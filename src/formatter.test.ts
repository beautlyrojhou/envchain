import { formatDotenv, formatJson, formatExport, formatEnv } from './formatter';
import { EnvMap } from './types';

const sampleEnv: EnvMap = {
  APP_NAME: 'envchain',
  PORT: '3000',
  DATABASE_URL: 'postgres://localhost/db',
  GREETING: 'hello world',
  WITH_HASH: 'value#1',
};

describe('formatDotenv', () => {
  it('formats simple key=value pairs', () => {
    const result = formatDotenv({ PORT: '3000' });
    expect(result).toBe('PORT=3000');
  });

  it('quotes values containing spaces', () => {
    const result = formatDotenv({ GREETING: 'hello world' });
    expect(result).toBe('GREETING="hello world"');
  });

  it('quotes values containing hash characters', () => {
    const result = formatDotenv({ WITH_HASH: 'value#1' });
    expect(result).toBe('WITH_HASH="value#1"');
  });

  it('escapes newlines in values', () => {
    const result = formatDotenv({ MSG: 'line1\nline2' });
    expect(result).toBe('MSG=line1\\nline2');
  });

  it('produces multiple lines for multiple keys', () => {
    const result = formatDotenv({ A: '1', B: '2' });
    expect(result).toBe('A=1\nB=2');
  });
});

describe('formatJson', () => {
  it('returns valid JSON with all string values', () => {
    const result = formatJson({ PORT: '3000' });
    const parsed = JSON.parse(result);
    expect(parsed.PORT).toBe('3000');
  });

  it('produces compact JSON when pretty=false', () => {
    const result = formatJson({ A: '1' }, false);
    expect(result).toBe('{"A":"1"}');
  });
});

describe('formatExport', () => {
  it('prefixes each line with export', () => {
    const result = formatExport({ PORT: '3000' });
    expect(result).toBe("export PORT='3000'");
  });

  it('escapes single quotes in values', () => {
    const result = formatExport({ VAR: "it's alive" });
    expect(result).toContain("export VAR=");
    expect(result).toContain("it'\\''s alive");
  });
});

describe('formatEnv', () => {
  it('defaults to dotenv format', () => {
    const result = formatEnv({ KEY: 'val' });
    expect(result).toBe('KEY=val');
  });

  it('delegates to correct formatter by format name', () => {
    expect(formatEnv({ A: '1' }, 'json')).toContain('"A"');
    expect(formatEnv({ A: '1' }, 'export')).toContain('export A');
  });

  it('throws on unknown format', () => {
    expect(() => formatEnv(sampleEnv, 'xml' as any)).toThrow('Unknown output format');
  });
});
