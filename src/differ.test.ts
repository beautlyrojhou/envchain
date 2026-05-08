import { diffEnvMaps, formatDiff, EnvDiff } from './differ';

describe('diffEnvMaps', () => {
  const base = { FOO: 'foo', BAR: 'bar', SHARED: 'same' };
  const target = { BAR: 'baz', SHARED: 'same', NEW_KEY: 'new' };

  let diff: EnvDiff;

  beforeEach(() => {
    diff = diffEnvMaps(base, target);
  });

  it('detects added keys', () => {
    const added = diff.entries.filter(e => e.status === 'added');
    expect(added).toHaveLength(1);
    expect(added[0].key).toBe('NEW_KEY');
    expect(added[0].newValue).toBe('new');
  });

  it('detects removed keys', () => {
    const removed = diff.entries.filter(e => e.status === 'removed');
    expect(removed).toHaveLength(1);
    expect(removed[0].key).toBe('FOO');
    expect(removed[0].oldValue).toBe('foo');
  });

  it('detects changed keys', () => {
    const changed = diff.entries.filter(e => e.status === 'changed');
    expect(changed).toHaveLength(1);
    expect(changed[0].key).toBe('BAR');
    expect(changed[0].oldValue).toBe('bar');
    expect(changed[0].newValue).toBe('baz');
  });

  it('detects unchanged keys', () => {
    const unchanged = diff.entries.filter(e => e.status === 'unchanged');
    expect(unchanged).toHaveLength(1);
    expect(unchanged[0].key).toBe('SHARED');
  });

  it('returns correct summary counts', () => {
    expect(diff.added).toBe(1);
    expect(diff.removed).toBe(1);
    expect(diff.changed).toBe(1);
    expect(diff.unchanged).toBe(1);
  });

  it('returns empty diff for identical maps', () => {
    const d = diffEnvMaps({ A: '1' }, { A: '1' });
    expect(d.added).toBe(0);
    expect(d.removed).toBe(0);
    expect(d.changed).toBe(0);
    expect(d.unchanged).toBe(1);
  });

  it('handles empty base', () => {
    const d = diffEnvMaps({}, { X: 'y' });
    expect(d.added).toBe(1);
    expect(d.removed).toBe(0);
  });

  it('handles empty target', () => {
    const d = diffEnvMaps({ X: 'y' }, {});
    expect(d.removed).toBe(1);
    expect(d.added).toBe(0);
  });
});

describe('formatDiff', () => {
  it('formats diff output with summary', () => {
    const diff = diffEnvMaps({ OLD: 'v1' }, { NEW: 'v2' });
    const output = formatDiff(diff);
    expect(output).toContain('+ NEW=v2');
    expect(output).toContain('- OLD=v1');
    expect(output).toContain('Summary:');
  });

  it('hides unchanged entries by default', () => {
    const diff = diffEnvMaps({ A: '1' }, { A: '1' });
    const output = formatDiff(diff);
    expect(output).not.toContain('  A=1');
  });

  it('shows unchanged entries when flag is set', () => {
    const diff = diffEnvMaps({ A: '1' }, { A: '1' });
    const output = formatDiff(diff, true);
    expect(output).toContain('  A=1');
  });
});
