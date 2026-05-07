/**
 * redactor.ts
 * Utilities for masking sensitive environment variable values
 * before logging, formatting, or displaying output.
 */

export const DEFAULT_SENSITIVE_PATTERNS: RegExp[] = [
  /secret/i,
  /password/i,
  /passwd/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
  /cert/i,
  /signing/i,
];

export interface RedactOptions {
  patterns?: RegExp[];
  maskChar?: string;
  revealChars?: number;
}

/**
 * Returns true if the given key matches any sensitive pattern.
 */
export function isSensitiveKey(
  key: string,
  patterns: RegExp[] = DEFAULT_SENSITIVE_PATTERNS
): boolean {
  return patterns.some((pattern) => pattern.test(key));
}

/**
 * Masks a single value, optionally revealing the last N characters.
 */
export function maskValue(
  value: string,
  maskChar = "*",
  revealChars = 0
): string {
  if (value.length === 0) return value;
  if (revealChars <= 0 || revealChars >= value.length) {
    return maskChar.repeat(Math.min(value.length, 8));
  }
  const hidden = maskChar.repeat(Math.max(value.length - revealChars, 4));
  return hidden + value.slice(-revealChars);
}

/**
 * Redacts sensitive values in an env map, returning a new map
 * with masked values for keys that match sensitive patterns.
 */
export function redactEnvMap(
  envMap: Record<string, string>,
  options: RedactOptions = {}
): Record<string, string> {
  const {
    patterns = DEFAULT_SENSITIVE_PATTERNS,
    maskChar = "*",
    revealChars = 0,
  } = options;

  return Object.fromEntries(
    Object.entries(envMap).map(([key, value]) => [
      key,
      isSensitiveKey(key, patterns) ? maskValue(value, maskChar, revealChars) : value,
    ])
  );
}
