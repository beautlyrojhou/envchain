import { LintIssue, LintResult } from './linter';

const SEVERITY_ICONS: Record<string, string> = {
  error: '✖',
  warn:  '⚠',
  info:  'ℹ',
};

export function formatLintIssue(issue: LintIssue): string {
  const icon = SEVERITY_ICONS[issue.severity] ?? '?';
  return `  ${icon} [${issue.severity.toUpperCase()}] ${issue.key}: ${issue.message} (${issue.rule})`;
}

export function formatLintResult(result: LintResult): string {
  if (result.issues.length === 0) {
    return '✔ No lint issues found.';
  }
  const lines: string[] = [];
  const grouped: Record<string, LintIssue[]> = {};
  for (const issue of result.issues) {
    (grouped[issue.severity] ??= []).push(issue);
  }
  for (const severity of ['error', 'warn', 'info']) {
    const group = grouped[severity];
    if (!group) continue;
    lines.push(`\n${severity.toUpperCase()}S (${group.length}):`);
    for (const issue of group) {
      lines.push(formatLintIssue(issue));
    }
  }
  lines.push(
    `\nSummary: ${result.errorCount} error(s), ${result.warnCount} warning(s), ${result.infoCount} info(s)`
  );
  lines.push(result.passed ? '✔ Lint passed.' : '✖ Lint failed.');
  return lines.join('\n');
}

export function formatLintJson(result: LintResult): string {
  return JSON.stringify(
    {
      passed: result.passed,
      errorCount: result.errorCount,
      warnCount: result.warnCount,
      infoCount: result.infoCount,
      issues: result.issues,
    },
    null,
    2
  );
}
