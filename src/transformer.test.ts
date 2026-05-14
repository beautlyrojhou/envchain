import { applyRule, transformEnvMap, TransformOptions } from './transformer';
import { EnvMap } from './types';

describe('applyRule', () => {
  it('trims whitespace from key and value', () => {
    expect(applyRule('  KEY  ', '  value  ', 'trim')).toEqual({ key: 'KEY', value: 'value' });
  });

  it('uppercases keys', () => {
    expect(applyRule('my_key', 'hello', 'uppercase-keys')).toEqual({ key: 'MY_KEY', value: 'hello' });
  });

  it('lowercases keys', () => {
    expect(applyRule('MY_KEY', 'hello', 'lowercase-keys')).toEqual({ key: 'my_key', value: 'hello' });
  });

  it('uppercases values', () => {
    expect(applyRule('KEY', 'hello', 'uppercase-values')).toEqual({ key: 'KEY', value: 'HELLO' });
  });

  it('lowercases values', () => {
    expect(applyRule('KEY', 'HELLO', 'lowercase-values')).toEqual({ key: 'KEY', value: 'hello' });
  });

  it('returns null for empty value when remove-empty is applied', () => {
    expect(applyRule('KEY', '   ', 'remove-empty')).toBeNull();
  });

  it('keeps non-empty value when remove-empty is applied', () => {
    expect(applyRule('KEY', 'value', 'remove-empty')).toEqual({ key: 'KEY', value: 'value' });
  });
});

describe('transformEnvMap', () => {
  const input: EnvMap = {
    '  api_key  ': '  secret  ',
    'db_host': 'localhost',
    'empty_val': '  ',
  };

  it('applies trim rule to all entries', () => {
    const result = transformEnvMap(input, { rules: ['trim'] });
    expect(result['api_key']).toBe('secret');
    expect(result['db_host']).toBe('localhost');
  });

  it('applies multiple rules in sequence', () => {
    const result = transformEnvMap(input, { rules: ['trim', 'uppercase-keys'] });
    expect(result['API_KEY']).toBe('secret');
    expect(result['DB_HOST']).toBe('localhost');
  });

  it('removes empty entries with remove-empty rule', () => {
    const result = transformEnvMap(input, { rules: ['trim', 'remove-empty'] });
    expect('empty_val' in result).toBe(false);
    expect(result['api_key']).toBe('secret');
  });

  it('returns empty map for empty input', () => {
    expect(transformEnvMap({}, { rules: ['trim', 'uppercase-keys'] })).toEqual({});
  });

  it('does not mutate the original map', () => {
    const original: EnvMap = { key: 'value' };
    transformEnvMap(original, { rules: ['uppercase-keys'] });
    expect(original).toEqual({ key: 'value' });
  });
});
