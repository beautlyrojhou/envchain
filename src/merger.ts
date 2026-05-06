import { EnvMap, EnvChainConfig } from './types';

/**
 * Merges multiple environment maps in order,
 * with later entries taking precedence over earlier ones.
 */
export function mergeEnvMaps(...maps: EnvMap[]): EnvMap {
  return Object.assign({}, ...maps);
}

/**
 * Applies stage-specific overrides on top of a base environment map.
 * Returns a new merged map without mutating inputs.
 */
export function applyStageOverrides(
  base: EnvMap,
  stage: string,
  config: EnvChainConfig
): EnvMap {
  const stageOverrides = config.stages?.[stage] ?? {};
  return mergeEnvMaps(base, stageOverrides);
}

/**
 * Resolves the final environment map by walking the stage inheritance chain.
 * If a stage declares `extends`, its parent is resolved first.
 */
export function resolveStageEnv(
  stage: string,
  config: EnvChainConfig,
  baseEnv: EnvMap = {}
): EnvMap {
  const stageDef = config.stages?.[stage];

  if (!stageDef) {
    throw new Error(`Stage "${stage}" is not defined in the config.`);
  }

  let resolved: EnvMap = { ...baseEnv };

  if (stageDef.extends) {
    resolved = resolveStageEnv(stageDef.extends, config, resolved);
  }

  return mergeEnvMaps(resolved, stageDef.env ?? {});
}
