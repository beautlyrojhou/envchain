import { EnvMap } from './types';

export type LintSeverity = 'error' | 'warn' | 'info';

export interface LintIssue {
  key: string;
  message: string;
  severity: LintSeverity;
  rule: string;
}

export interface LintResult {
  issues: LintIssue[];
  errorCount: number;
  warnCount: number;
  infoCount: number;
  passed: boolean;
}

export function lintKeyNaming(env: EnvMap): LintIssue[] {
  const issues: LintIssue[] = [];
  for (const key of Object.keys(env)) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
      issues.push({
        key,
        message: `Key "${key}" should be UPPER_SNAKE_CASE`,
        severity: 'warn',
        rule: 'key-naming',
      });
    }
    if (key.startsWith('_') || key.endsWith('_')) {
      issues.push({
        key,
        message: `Key "${key}" should not start or end with underscore`,
        severity: 'warn',
        rule: 'key-underscore-boundary',
      });
    }
  }
  return issues;
}

export function lintEmptyKeys(env: EnvMap): LintIssue[] {
  return Object.entries(env)
    .filter(([, v]) => v === '')
    .map(([key]) => ({
      key,
      message: `Key "${key}" has an empty value`,
      severity: 'warn' as LintSeverity,
      rule: 'no-empty-value',
    }));
}

export function lintLongValues(env: EnvMap, maxLength = 512): LintIssue[] {
  return Object.entries(env)
    .filter(([, v]) => v.length > maxLength)
    .map(([key]) => ({
      key,
      message: `Key "${key}" value exceeds ${maxLength} characters`,
      severity: 'info' as LintSeverity,
      rule: 'max-value-length',
    }));
}

export function lintEnv(env: EnvMap): LintResult {
  const issues: LintIssue[] = [
    ...lintKeyNaming(env),
    ...lintEmptyKeys(env),
    ...lintLongValues(env),
  ];
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warnCount = issues.filter(i => i.severity === 'warn').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;
  return { issues, errorCount, warnCount, infoCount, passed: errorCount === 0 };
}
