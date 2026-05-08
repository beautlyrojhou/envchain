import { auditEmptyValues, auditDuplicateKeys, auditUnresolvedRefs, auditEnv } from './auditor';

describe('auditEmptyValues', () => {
  it('flags keys with empty string values', () => {
    const issues = auditEmptyValues({ DB_HOST: '', API_KEY: 'abc' });
    expect(issues).toHaveLength(1);
    expect(issues[0].key).toBe('DB_HOST');
    expect(issues[0].severity).toBe('warn');
  });

  it('returns no issues when all values are non-empty', () => {
    const issues = auditEmptyValues({ DB_HOST: 'localhost', PORT: '5432' });
    expect(issues).toHaveLength(0);
  });

  it('ignores allowlisted empty keys', () => {
    const issues = auditEmptyValues({ OPTIONAL_FEATURE_FLAG: '' });
    expect(issues).toHaveLength(0);
  });
});

describe('auditDuplicateKeys', () => {
  it('detects keys appearing in multiple maps', () => {
    const maps = [{ DB_HOST: 'a', PORT: '3000' }, { DB_HOST: 'b', SECRET: 'x' }];
    const issues = auditDuplicateKeys(maps);
    expect(issues).toHaveLength(1);
    expect(issues[0].key).toBe('DB_HOST');
    expect(issues[0].severity).toBe('info');
  });

  it('returns no issues for unique keys across maps', () => {
    const maps = [{ A: '1' }, { B: '2' }];
    expect(auditDuplicateKeys(maps)).toHaveLength(0);
  });
});

describe('auditUnresolvedRefs', () => {
  it('flags references to undefined keys', () => {
    const env = { URL: 'http://${HOST}:${PORT}', HOST: 'localhost' };
    const issues = auditUnresolvedRefs(env);
    expect(issues).toHaveLength(1);
    expect(issues[0].key).toBe('URL');
    expect(issues[0].message).toContain('PORT');
    expect(issues[0].severity).toBe('error');
  });

  it('returns no issues when all refs are resolvable', () => {
    const env = { HOST: 'localhost', PORT: '8080', URL: 'http://${HOST}:${PORT}' };
    expect(auditUnresolvedRefs(env)).toHaveLength(0);
  });

  it('returns no issues for env with no interpolation', () => {
    const env = { NAME: 'envchain', VERSION: '1.0.0' };
    expect(auditUnresolvedRefs(env)).toHaveLength(0);
  });
});

describe('auditEnv', () => {
  it('returns passed=false when there are error-severity issues', () => {
    const env = { URL: '${MISSING_VAR}' };
    const report = auditEnv(env);
    expect(report.passed).toBe(false);
    expect(report.issues.some((i) => i.severity === 'error')).toBe(true);
  });

  it('returns passed=true when issues are only warn or info', () => {
    const env = { DB: '' };
    const report = auditEnv(env);
    expect(report.passed).toBe(true);
  });

  it('aggregates issues from all audit checks', () => {
    const env = { A: '', B: '${MISSING}' };
    const report = auditEnv(env, [env, { A: 'override' }]);
    const severities = report.issues.map((i) => i.severity);
    expect(severities).toContain('warn');
    expect(severities).toContain('error');
    expect(severities).toContain('info');
  });
});
