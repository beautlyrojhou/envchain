import { compareEnvMaps, formatCompareResult } from './comparator';

describe('compareEnvMaps', () => {
  it('reports all matching when maps are identical', () => {
    const env = { A: '1', B: '2' };
    const result = compareEnvMaps(env, env);
    expect(result.matching).toEqual(['A', 'B']);
    expect(result.missingInA).toHaveLength(0);
    expect(result.missingInB).toHaveLength(0);
    expect(result.diverged).toHaveLength(0);
    expect(result.score).toBe(100);
  });

  it('detects keys missing in A', () => {
    const a = { A: '1' };
    const b = { A: '1', B: '2' };
    const result = compareEnvMaps(a, b);
    expect(result.missingInA).toContain('B');
    expect(result.score).toBe(50);
  });

  it('detects keys missing in B', () => {
    const a = { A: '1', B: '2' };
    const b = { A: '1' };
    const result = compareEnvMaps(a, b);
    expect(result.missingInB).toContain('B');
  });

  it('detects diverged values', () => {
    const a = { A: 'foo' };
    const b = { A: 'bar' };
    const result = compareEnvMaps(a, b);
    expect(result.diverged).toHaveLength(1);
    expect(result.diverged[0]).toMatchObject({ key: 'A', valueA: 'foo', valueB: 'bar' });
    expect(result.score).toBe(0);
  });

  it('returns score 100 for empty maps', () => {
    const result = compareEnvMaps({}, {});
    expect(result.score).toBe(100);
  });

  it('handles mixed differences', () => {
    const a = { A: '1', B: '2', C: '3' };
    const b = { A: '1', B: 'X', D: '4' };
    const result = compareEnvMaps(a, b);
    expect(result.matching).toContain('A');
    expect(result.diverged.map(d => d.key)).toContain('B');
    expect(result.missingInA).toContain('D');
    expect(result.missingInB).toContain('C');
  });
});

describe('formatCompareResult', () => {
  it('includes similarity score', () => {
    const result = compareEnvMaps({ A: '1' }, { A: '1' });
    const output = formatCompareResult(result);
    expect(output).toContain('100%');
  });

  it('lists diverged keys with values', () => {
    const result = compareEnvMaps({ SECRET: 'abc' }, { SECRET: 'xyz' });
    const output = formatCompareResult(result, false);
    expect(output).toContain('abc');
    expect(output).toContain('xyz');
  });

  it('redacts values when redact=true', () => {
    const result = compareEnvMaps({ SECRET: 'abc' }, { SECRET: 'xyz' });
    const output = formatCompareResult(result, true);
    expect(output).not.toContain('abc');
    expect(output).toContain('***');
  });

  it('shows missing keys sections', () => {
    const result = compareEnvMaps({ A: '1' }, { B: '2' });
    const output = formatCompareResult(result);
    expect(output).toContain('missing in A');
    expect(output).toContain('missing in B');
  });
});
