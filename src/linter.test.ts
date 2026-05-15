import { lintKeyNaming, lintEmptyKeys, lintLongValues, lintEnv } from './linter';

describe('lintKeyNaming', () => {
  it('passes valid UPPER_SNAKE_CASE keys', () => {
    const result = lintKeyNaming({ DATABASE_URL: 'x', PORT: '3000' });
    expect(result).toHaveLength(0);
  });

  it('warns on lowercase keys', () => {
    const result = lintKeyNaming({ db_url: 'x' });
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe('key-naming');
    expect(result[0].severity).toBe('warn');
  });

  it('warns on keys starting with underscore', () => {
    const result = lintKeyNaming({ _SECRET: 'x' });
    const rules = result.map(i => i.rule);
    expect(rules).toContain('key-underscore-boundary');
  });

  it('warns on keys ending with underscore', () => {
    const result = lintKeyNaming({ SECRET_: 'x' });
    const rules = result.map(i => i.rule);
    expect(rules).toContain('key-underscore-boundary');
  });

  it('returns no issues for an empty env object', () => {
    const result = lintKeyNaming({});
    expect(result).toHaveLength(0);
  });
});

describe('lintEmptyKeys', () => {
  it('returns empty for non-empty values', () => {
    expect(lintEmptyKeys({ KEY: 'value' })).toHaveLength(0);
  });

  it('warns on empty string values', () => {
    const result = lintEmptyKeys({ EMPTY_KEY: '' });
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe('no-empty-value');
    expect(result[0].key).toBe('EMPTY_KEY');
  });

  it('warns on each empty value independently', () => {
    const result = lintEmptyKeys({ A: '', B: '', C: 'ok' });
    expect(result).toHaveLength(2);
    expect(result.map(i => i.key)).toEqual(expect.arrayContaining(['A', 'B']));
  });
});

describe('lintLongValues', () => {
  it('passes values within limit', () => {
    expect(lintLongValues({ KEY: 'short' }, 512)).toHaveLength(0);
  });

  it('flags values exceeding max length', () => {
    const longVal = 'x'.repeat(600);
    const result = lintLongValues({ LONG_KEY: longVal }, 512);
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe('max-value-length');
    expect(result[0].severity).toBe('info');
  });

  it('passes values exactly at the limit', () => {
    const exactVal = 'x'.repeat(512);
    const result = lintLongValues({ EXACT_KEY: exactVal }, 512);
    expect(result).toHaveLength(0);
  });
});

describe('lintEnv', () => {
  it('returns passed=true when no errors', () => {
    const result = lintEnv({ DATABASE_URL: 'postgres://localhost/db', PORT: '5432' });
    expect(result.passed).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  it('aggregates all issues', () => {
    const result = lintEnv({ bad_key: '', GOOD_KEY: 'x' });
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.warnCount).toBeGreaterThan(0);
  });

  it('counts severities correctly', () => {
    const env = { bad_key: '', ANOTHER_bad: '' };
    const result = lintEnv(env);
    expect(result.warnCount).toBe(result.issues.filter(i => i.severity === 'warn').length);
    expect(result.infoCount).toBe(result.issues.filter(i => i.severity === 'info').length);
  });
});
