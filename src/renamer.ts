/**
 * renamer.ts — Rename or prefix/suffix environment variable keys
 */

export interface RenameRule {
  from: string;
  to: string;
}

export interface RenameOptions {
  prefix?: string;
  suffix?: string;
  rules?: RenameRule[];
  stripPrefix?: string;
}

/**
 * Apply explicit rename rules to a key.
 * Returns the renamed key or the original if no rule matches.
 */
export function applyRenameRules(key: string, rules: RenameRule[]): string {
  const rule = rules.find((r) => r.from === key);
  return rule ? rule.to : key;
}

/**
 * Apply prefix/suffix transformations to a key.
 */
export function applyAffixes(
  key: string,
  prefix?: string,
  suffix?: string,
  stripPrefix?: string
): string {
  let result = key;
  if (stripPrefix && result.startsWith(stripPrefix)) {
    result = result.slice(stripPrefix.length);
  }
  if (prefix) result = `${prefix}${result}`;
  if (suffix) result = `${result}${suffix}`;
  return result;
}

/**
 * Rename all keys in an env map according to the provided options.
 * Explicit rules take precedence over prefix/suffix transforms.
 */
export function renameEnvMap(
  env: Record<string, string>,
  options: RenameOptions
): Record<string, string> {
  const { prefix, suffix, rules = [], stripPrefix } = options;
  const result: Record<string, string> = {};
  const seen = new Set<string>();

  for (const [key, value] of Object.entries(env)) {
    let newKey = applyRenameRules(key, rules);
    if (newKey === key) {
      newKey = applyAffixes(key, prefix, suffix, stripPrefix);
    }
    if (seen.has(newKey)) {
      throw new Error(`Rename collision: multiple keys resolve to "${newKey}"`);
    }
    seen.add(newKey);
    result[newKey] = value;
  }

  return result;
}
