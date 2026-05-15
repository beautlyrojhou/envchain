import { describe, it, expect } from 'vitest';
import { sortEnvMap, groupKeysByPrefix, extractPrefixes } from './sorter';

const sampleEnv = {
  DB_HOST: 'localhost',
  APP_NAME: 'envchain',
  DB_PORT: '5432',
  APP_ENV: 'production',
  REDIS_URL: 'redis://localhost',
  ZEBRA: 'last',
};

describe('sortEnvMap', () => {
  it('sorts keys ascending by default', () => {
    const result = sortEnvMap(sampleEnv);
    const keys = Object.keys(result);
    expect(keys).toEqual([...keys].sort());
  });

  it('sorts keys descending', () => {
    const result = sortEnvMap(sampleEnv, { order: 'desc' });
    const keys = Object.keys(result);
    expect(keys).toEqual([...keys].sort().reverse());
  });

  it('preserves values after sorting', () => {
    const result = sortEnvMap(sampleEnv);
    expect(result['DB_HOST']).toBe('localhost');
    expect(result['APP_NAME']).toBe('envchain');
  });

  it('groups by prefix ascending', () => {
    const result = sortEnvMap(sampleEnv, { groupByPrefix: true });
    const keys = Object.keys(result);
    const appIdx = keys.indexOf('APP_ENV');
    const appNameIdx = keys.indexOf('APP_NAME');
    const dbHostIdx = keys.indexOf('DB_HOST');
    expect(appIdx).toBeLessThan(dbHostIdx);
    expect(appIdx).toBeLessThan(appNameIdx);
  });

  it('handles empty env', () => {
    expect(sortEnvMap({})).toEqual({});
  });

  it('handles keys with no prefix delimiter', () => {
    const result = sortEnvMap({ ZEBRA: 'z', ALPHA: 'a' }, { groupByPrefix: true });
    expect(Object.keys(result)).toEqual(['ALPHA', 'ZEBRA']);
  });
});

describe('groupKeysByPrefix', () => {
  it('groups keys by prefix', () => {
    const groups = groupKeysByPrefix(['DB_HOST', 'DB_PORT', 'APP_NAME']);
    expect(groups['DB']).toEqual(['DB_HOST', 'DB_PORT']);
    expect(groups['APP']).toEqual(['APP_NAME']);
  });

  it('uses custom delimiter', () => {
    const groups = groupKeysByPrefix(['DB.HOST', 'DB.PORT'], '.');
    expect(groups['DB']).toHaveLength(2);
  });
});

describe('extractPrefixes', () => {
  it('extracts unique prefixes', () => {
    const prefixes = extractPrefixes(sampleEnv);
    expect(prefixes).toContain('DB');
    expect(prefixes).toContain('APP');
    expect(prefixes).toContain('REDIS');
  });

  it('excludes keys without delimiter', () => {
    const prefixes = extractPrefixes({ ZEBRA: 'last', APP_X: 'x' });
    expect(prefixes).not.toContain('ZEBRA');
    expect(prefixes).toContain('APP');
  });
});
