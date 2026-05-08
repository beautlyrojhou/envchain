import { EnvMap } from './types';

export type AuditSeverity = 'info' | 'warn' | 'error';

export interface AuditIssue {
  key: string;
  severity: AuditSeverity;
  message: string;
}

export interface AuditReport {
  issues: AuditIssue[];
  passed: boolean;
}

const EMPTY_VALUE_KEYS_ALLOWLIST = ['OPTIONAL_FEATURE_FLAG'];

export function auditEmptyValues(env: EnvMap): AuditIssue[] {
  return Object.entries(env)
    .filter(([key, val]) => val === '' && !EMPTY_VALUE_KEYS_ALLOWLIST.includes(key))
    .map(([key]) => ({
      key,
      severity: 'warn' as AuditSeverity,
      message: `Key "${key}" is defined but has an empty value.`,
    }));
}

export function auditDuplicateKeys(maps: EnvMap[]): AuditIssue[] {
  const seen = new Map<string, number>();
  for (const map of maps) {
    for (const key of Object.keys(map)) {
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
  }
  return Array.from(seen.entries())
    .filter(([, count]) => count > 1)
    .map(([key]) => ({
      key,
      severity: 'info' as AuditSeverity,
      message: `Key "${key}" appears in multiple env maps and will be overridden.`,
    }));
}

export function auditUnresolvedRefs(env: EnvMap): AuditIssue[] {
  const refPattern = /\$\{([^}]+)\}/g;
  const issues: AuditIssue[] = [];
  for (const [key, val] of Object.entries(env)) {
    const matches = [...(val?.matchAll(refPattern) ?? [])];
    for (const match of matches) {
      const refKey = match[1];
      if (!(refKey in env)) {
        issues.push({
          key,
          severity: 'error',
          message: `Key "${key}" references undefined variable "${refKey}".`,
        });
      }
    }
  }
  return issues;
}

export function auditEnv(env: EnvMap, allMaps: EnvMap[] = []): AuditReport {
  const issues: AuditIssue[] = [
    ...auditEmptyValues(env),
    ...auditDuplicateKeys(allMaps.length ? allMaps : [env]),
    ...auditUnresolvedRefs(env),
  ];
  const passed = issues.every((i) => i.severity !== 'error');
  return { issues, passed };
}
