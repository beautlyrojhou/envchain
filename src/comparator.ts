import { EnvMap } from './types';

export interface CompareResult {
  matching: string[];
  missingInA: string[];
  missingInB: string[];
  diverged: Array<{ key: string; valueA: string; valueB: string }>;
  score: number; // 0–100 similarity score
}

export function compareEnvMaps(a: EnvMap, b: EnvMap): CompareResult {
  const keysA = new Set(Object.keys(a));
  const keysB = new Set(Object.keys(b));
  const allKeys = new Set([...keysA, ...keysB]);

  const matching: string[] = [];
  const missingInA: string[] = [];
  const missingInB: string[] = [];
  const diverged: CompareResult['diverged'] = [];

  for (const key of allKeys) {
    const inA = keysA.has(key);
    const inB = keysB.has(key);

    if (inA && inB) {
      if (a[key] === b[key]) {
        matching.push(key);
      } else {
        diverged.push({ key, valueA: a[key], valueB: b[key] });
      }
    } else if (!inA) {
      missingInA.push(key);
    } else {
      missingInB.push(key);
    }
  }

  const total = allKeys.size;
  const score = total === 0 ? 100 : Math.round((matching.length / total) * 100);

  return { matching, missingInA, missingInB, diverged, score };
}

export function formatCompareResult(result: CompareResult, redact = false): string {
  const lines: string[] = [];
  lines.push(`Similarity score: ${result.score}%`);
  lines.push(`  Matching keys   : ${result.matching.length}`);
  lines.push(`  Missing in A    : ${result.missingInA.length}`);
  lines.push(`  Missing in B    : ${result.missingInB.length}`);
  lines.push(`  Diverged values : ${result.diverged.length}`);

  if (result.missingInA.length) {
    lines.push('\nKeys only in B (missing in A):');
    result.missingInA.forEach(k => lines.push(`  + ${k}`));
  }

  if (result.missingInB.length) {
    lines.push('\nKeys only in A (missing in B):');
    result.missingInB.forEach(k => lines.push(`  - ${k}`));
  }

  if (result.diverged.length) {
    lines.push('\nDiverged values:');
    result.diverged.forEach(({ key, valueA, valueB }) => {
      const a = redact ? '***' : valueA;
      const b = redact ? '***' : valueB;
      lines.push(`  ~ ${key}: "${a}" → "${b}"`);
    });
  }

  return lines.join('\n');
}
