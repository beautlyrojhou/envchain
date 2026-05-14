import {
  createProfile,
  compareProfiles,
  filterProfileByTags,
  mergeProfiles,
} from './profiler';

describe('createProfile', () => {
  it('creates a profile with name, env, and timestamp', () => {
    const profile = createProfile('dev', { APP_ENV: 'development' });
    expect(profile.name).toBe('dev');
    expect(profile.env).toEqual({ APP_ENV: 'development' });
    expect(typeof profile.createdAt).toBe('string');
    expect(profile.tags).toBeUndefined();
  });

  it('includes tags when provided', () => {
    const profile = createProfile('prod', {}, ['production', 'stable']);
    expect(profile.tags).toEqual(['production', 'stable']);
  });
});

describe('compareProfiles', () => {
  const base = createProfile('base', { A: '1', B: '2', C: '3' });
  const target = createProfile('target', { A: '1', B: 'changed', D: '4' });

  it('detects added keys', () => {
    const result = compareProfiles(base, target);
    expect(result.added).toEqual(['D']);
  });

  it('detects removed keys', () => {
    const result = compareProfiles(base, target);
    expect(result.removed).toEqual(['C']);
  });

  it('detects changed keys', () => {
    const result = compareProfiles(base, target);
    expect(result.changed).toEqual(['B']);
  });

  it('detects unchanged keys', () => {
    const result = compareProfiles(base, target);
    expect(result.unchanged).toEqual(['A']);
  });

  it('returns empty arrays for identical profiles', () => {
    const same = createProfile('same', { A: '1', B: '2', C: '3' });
    const result = compareProfiles(base, same);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.changed).toHaveLength(0);
    expect(result.unchanged).toHaveLength(3);
  });
});

describe('filterProfileByTags', () => {
  const profiles = [
    createProfile('dev', {}, ['dev', 'local']),
    createProfile('staging', {}, ['staging']),
    createProfile('prod', {}, ['production', 'stable']),
    createProfile('no-tags', {}),
  ];

  it('returns profiles matching any of the given tags', () => {
    const result = filterProfileByTags(profiles, ['dev', 'production']);
    expect(result.map((p) => p.name)).toEqual(['dev', 'prod']);
  });

  it('returns empty array when no profiles match', () => {
    const result = filterProfileByTags(profiles, ['nonexistent']);
    expect(result).toHaveLength(0);
  });
});

describe('mergeProfiles', () => {
  it('merges env maps with override taking precedence', () => {
    const base = createProfile('base', { A: '1', B: '2' });
    const override = createProfile('override', { B: 'new', C: '3' });
    const merged = mergeProfiles(base, override, 'merged');
    expect(merged.name).toBe('merged');
    expect(merged.env).toEqual({ A: '1', B: 'new', C: '3' });
  });
});
