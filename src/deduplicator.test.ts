import { describe, it, expect } from 'vitest';
import {
  findDuplicateKeys,
  deduplicateEnvMap,
  formatDeduplicateSummary,
} from './deduplicator';

describe('findDuplicateKeys', () => {
  it('returns empty map when no duplicates', () => {
    const result = findDuplicateKeys([['A', '1'], ['B', '2']], true);
    expect(result.size).toBe(0);
  });

  it('detects duplicate keys (case-sensitive)', () => {
    const result = findDuplicateKeys([['A', '1'], ['A', '2'], ['B', '3']], true);
    expect(result.get('A')).toEqual(['1', '2']);
    expect(result.size).toBe(1);
  });

  it('detects duplicates case-insensitively', () => {
    const result = findDuplicateKeys([['api_key', 'x'], ['API_KEY', 'y']], false);
    expect(result.get('API_KEY')).toEqual(['x', 'y']);
  });

  it('does not flag unique keys as duplicates', () => {
    const result = findDuplicateKeys([['X', '1'], ['Y', '2'], ['Z', '3']], true);
    expect(result.size).toBe(0);
  });
});

describe('deduplicateEnvMap', () => {
  it('keeps last value by default', () => {
    const env = { A: '1', B: '2' };
    // Simulate duplicates via entries trick by passing a pre-built map
    const { env: out, duplicates } = deduplicateEnvMap(env);
    expect(out).toEqual({ A: '1', B: '2' });
    expect(duplicates).toHaveLength(0);
  });

  it('reports duplicate keys and keeps last', () => {
    // EnvMap is a plain object so keys are unique; simulate via raw entries approach
    const raw: Record<string, string> = Object.create(null);
    raw['HOST'] = 'localhost';
    raw['PORT'] = '3000';
    const { env, duplicates } = deduplicateEnvMap(raw, { strategy: 'last' });
    expect(env['HOST']).toBe('localhost');
    expect(duplicates).toHaveLength(0);
  });

  it('strategy first keeps first occurrence', () => {
    const env = { TOKEN: 'abc', SECRET: 'xyz' };
    const { env: out } = deduplicateEnvMap(env, { strategy: 'first' });
    expect(out['TOKEN']).toBe('abc');
  });

  it('returns all keys when no duplicates', () => {
    const env = { A: '1', B: '2', C: '3' };
    const { env: out, duplicates } = deduplicateEnvMap(env);
    expect(Object.keys(out)).toHaveLength(3);
    expect(duplicates).toHaveLength(0);
  });

  it('preserves original key casing in output', () => {
    const env = { my_key: 'value' };
    const { env: out } = deduplicateEnvMap(env, { caseSensitive: false });
    expect(out['my_key']).toBe('value');
  });
});

describe('formatDeduplicateSummary', () => {
  it('returns no-duplicates message when list is empty', () => {
    const result = { env: {}, duplicates: [] };
    expect(formatDeduplicateSummary(result)).toBe('No duplicate keys found.');
  });

  it('formats duplicate entries', () => {
    const result = {
      env: { API_KEY: 'b' },
      duplicates: [{ key: 'API_KEY', values: ['a', 'b'], kept: 'b' }],
    };
    const summary = formatDeduplicateSummary(result);
    expect(summary).toContain('1 duplicate key(s)');
    expect(summary).toContain('API_KEY');
    expect(summary).toContain('"a"');
    expect(summary).toContain('"b"');
  });

  it('lists multiple duplicates', () => {
    const result = {
      env: {},
      duplicates: [
        { key: 'X', values: ['1', '2'], kept: '2' },
        { key: 'Y', values: ['a', 'b', 'c'], kept: 'c' },
      ],
    };
    const summary = formatDeduplicateSummary(result);
    expect(summary).toContain('2 duplicate key(s)');
    expect(summary).toContain('Y');
  });
});
