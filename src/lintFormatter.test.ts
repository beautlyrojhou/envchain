import { formatLintIssue, formatLintResult, formatLintJson } from './lintFormatter';
import { LintIssue, LintResult } from './linter';

const warnIssue: LintIssue = {
  key: 'bad_key',
  message: 'Key "bad_key" should be UPPER_SNAKE_CASE',
  severity: 'warn',
  rule: 'key-naming',
};

const infoIssue: LintIssue = {
  key: 'LONG_KEY',
  message: 'Key "LONG_KEY" value exceeds 512 characters',
  severity: 'info',
  rule: 'max-value-length',
};

const cleanResult: LintResult = {
  issues: [],
  errorCount: 0,
  warnCount: 0,
  infoCount: 0,
  passed: true,
};

const failResult: LintResult = {
  issues: [warnIssue, infoIssue],
  errorCount: 0,
  warnCount: 1,
  infoCount: 1,
  passed: true,
};

describe('formatLintIssue', () => {
  it('includes severity icon and rule', () => {
    const output = formatLintIssue(warnIssue);
    expect(output).toContain('⚠');
    expect(output).toContain('WARN');
    expect(output).toContain('key-naming');
    expect(output).toContain('bad_key');
  });

  it('uses info icon for info severity', () => {
    const output = formatLintIssue(infoIssue);
    expect(output).toContain('ℹ');
  });
});

describe('formatLintResult', () => {
  it('returns success message when no issues', () => {
    expect(formatLintResult(cleanResult)).toContain('No lint issues found');
  });

  it('includes summary line with counts', () => {
    const output = formatLintResult(failResult);
    expect(output).toContain('1 warning(s)');
    expect(output).toContain('1 info(s)');
  });

  it('shows passed status', () => {
    expect(formatLintResult(failResult)).toContain('✔ Lint passed.');
  });
});

describe('formatLintJson', () => {
  it('returns valid JSON', () => {
    const json = formatLintJson(cleanResult);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('includes all top-level fields', () => {
    const parsed = JSON.parse(formatLintJson(failResult));
    expect(parsed).toHaveProperty('passed');
    expect(parsed).toHaveProperty('issues');
    expect(parsed.issues).toHaveLength(2);
  });
});
