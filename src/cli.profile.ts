/**
 * cli.profile.ts — CLI handler for profile subcommands
 */

import { EnvMap } from './types';
import {
  createProfile,
  compareProfiles,
  mergeProfiles,
  EnvProfile,
} from './profiler';
import { formatDiff } from './differ';

export interface ProfileCommandArgs {
  subcommand: 'create' | 'compare' | 'merge';
  names: string[];
  env?: EnvMap;
  tags?: string[];
  outputFormat?: 'text' | 'json';
}

const profileStore: Map<string, EnvProfile> = new Map();

export function runProfileCommand(args: ProfileCommandArgs): string {
  switch (args.subcommand) {
    case 'create': {
      const [name] = args.names;
      if (!name) throw new Error('Profile name is required');
      const profile = createProfile(name, args.env ?? {}, args.tags);
      profileStore.set(name, profile);
      return `Profile "${name}" created at ${profile.createdAt}`;
    }

    case 'compare': {
      const [baseName, targetName] = args.names;
      if (!baseName || !targetName)
        throw new Error('Two profile names required for compare');
      const base = profileStore.get(baseName);
      const target = profileStore.get(targetName);
      if (!base) throw new Error(`Profile "${baseName}" not found`);
      if (!target) throw new Error(`Profile "${targetName}" not found`);
      const comparison = compareProfiles(base, target);
      if (args.outputFormat === 'json') {
        return JSON.stringify(comparison, null, 2);
      }
      const lines = [
        `Comparing "${baseName}" → "${targetName}":`,
        `  Added:     ${comparison.added.join(', ') || 'none'}`,
        `  Removed:   ${comparison.removed.join(', ') || 'none'}`,
        `  Changed:   ${comparison.changed.join(', ') || 'none'}`,
        `  Unchanged: ${comparison.unchanged.length} keys`,
      ];
      return lines.join('\n');
    }

    case 'merge': {
      const [baseName, overrideName, outName] = args.names;
      if (!baseName || !overrideName || !outName)
        throw new Error('base, override, and output profile names required');
      const base = profileStore.get(baseName);
      const override = profileStore.get(overrideName);
      if (!base) throw new Error(`Profile "${baseName}" not found`);
      if (!override) throw new Error(`Profile "${overrideName}" not found`);
      const merged = mergeProfiles(base, override, outName);
      profileStore.set(outName, merged);
      return `Profile "${outName}" created from merge of "${baseName}" + "${overrideName}"`;
    }

    default:
      throw new Error(`Unknown profile subcommand: ${(args as any).subcommand}`);
  }
}

export function getProfileStore(): Map<string, EnvProfile> {
  return profileStore;
}

export function clearProfileStore(): void {
  profileStore.clear();
}
