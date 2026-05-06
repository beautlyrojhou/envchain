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
 *
 * @throws If a stage is not defined in the config.
 * @throws If a circular inheritance chain is detected.
 */
export function resolveStageEnv(
  stage: string,
  config: EnvChainConfig,
  baseEnv: EnvMap = {},
  _visited: Set<string> = new Set()
): EnvMap {
  if (_visited.has(stage)) {
    throw new Error(
      `Circular stage inheritance detected: "${stage}" has already been visited (chain: ${[..._visited, stage].join(' -> ')}).`
    );
  }

  const stageDef = config.stages?.[stage];

  if (!stageDef) {
    throw new Error(`Stage "${stage}" is not defined in the config.`);
  }

  _visited.add(stage);

  let resolved: EnvMap = { ...baseEnv };

  if (stageDef.extends) {
    resolved = resolveStageEnv(stageDef.extends, config, resolved, _visited);
  }

  return mergeEnvMaps(resolved, stageDef.env ?? {});
}
