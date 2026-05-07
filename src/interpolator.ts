/**
 * interpolator.ts
 * Resolves variable references within env values (e.g. $VAR or ${VAR})
 */

export type EnvMap = Record<string, string>;

const INTERPOLATION_RE = /\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/g;

/**
 * Interpolate a single value string against a source map.
 * References to unknown keys are left as-is.
 */
export function interpolateValue(value: string, source: EnvMap): string {
  return value.replace(INTERPOLATION_RE, (match, braced, bare) => {
    const key = braced ?? bare;
    return Object.prototype.hasOwnProperty.call(source, key)
      ? source[key]
      : match;
  });
}

/**
 * Interpolate all values in an env map against itself (and optionally a
 * base map that is checked first, e.g. process.env).
 *
 * Values are resolved in insertion order; forward references to keys that
 * appear later in the map are supported via a two-pass strategy.
 */
export function interpolateEnvMap(
  envMap: EnvMap,
  base: EnvMap = {}
): EnvMap {
  // First pass: build a combined lookup so forward references work
  const combined: EnvMap = { ...base, ...envMap };

  const result: EnvMap = {};
  for (const [key, value] of Object.entries(envMap)) {
    result[key] = interpolateValue(value, combined);
  }
  return result;
}

/**
 * Detect circular references within an env map.
 * Returns an array of keys that are part of a cycle.
 */
export function detectCircularRefs(envMap: EnvMap): string[] {
  const circular: string[] = [];

  for (const [key, value] of Object.entries(envMap)) {
    const refs = [...value.matchAll(INTERPOLATION_RE)].map(
      ([, braced, bare]) => braced ?? bare
    );
    for (const ref of refs) {
      if (ref === key) {
        circular.push(key);
        break;
      }
      // One-level indirect cycle check
      const refValue = envMap[ref] ?? "";
      const backRefs = [...refValue.matchAll(INTERPOLATION_RE)].map(
        ([, b, r]) => b ?? r
      );
      if (backRefs.includes(key) && !circular.includes(key)) {
        circular.push(key);
      }
    }
  }

  return circular;
}
