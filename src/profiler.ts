/**
 * profiler.ts — Profile and compare env configs across named profiles
 */

import { EnvMap } from './types';

export interface EnvProfile {
  name: string;
  env: EnvMap;
  createdAt: string;
  tags?: string[];
}

export interface ProfileComparison {
  added: string[];
  removed: string[];
  changed: string[];
  unchanged: string[];
}

export function createProfile(
  name: string,
  env: EnvMap,
  tags?: string[]
): EnvProfile {
  return {
    name,
    env,
    createdAt: new Date().toISOString(),
    tags,
  };
}

export function compareProfiles(
  base: EnvProfile,
  target: EnvProfile
): ProfileComparison {
  const baseKeys = new Set(Object.keys(base.env));
  const targetKeys = new Set(Object.keys(target.env));

  const added = [...targetKeys].filter((k) => !baseKeys.has(k));
  const removed = [...baseKeys].filter((k) => !targetKeys.has(k));
  const changed: string[] = [];
  const unchanged: string[] = [];

  for (const key of baseKeys) {
    if (!targetKeys.has(key)) continue;
    if (base.env[key] !== target.env[key]) {
      changed.push(key);
    } else {
      unchanged.push(key);
    }
  }

  return { added, removed, changed, unchanged };
}

export function filterProfileByTags(
  profiles: EnvProfile[],
  tags: string[]
): EnvProfile[] {
  return profiles.filter(
    (p) => p.tags && tags.some((t) => p.tags!.includes(t))
  );
}

export function mergeProfiles(
  base: EnvProfile,
  overrides: EnvProfile,
  name: string
): EnvProfile {
  return createProfile(name, { ...base.env, ...overrides.env });
}
