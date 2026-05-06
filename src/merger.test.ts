import { mergeEnvMaps, applyStageOverrides, resolveStageEnv } from './merger';
import { EnvChainConfig } from './types';

const baseConfig: EnvChainConfig = {
  stages: {
    base: {
      env: { APP_NAME: 'envchain', LOG_LEVEL: 'info' },
    },
    staging: {
      extends: 'base',
      env: { LOG_LEVEL: 'debug', API_URL: 'https://staging.example.com' },
    },
    production: {
      extends: 'base',
      env: { API_URL: 'https://example.com' },
    },
  },
};

describe('mergeEnvMaps', () => {
  it('merges two maps with later values taking precedence', () => {
    const result = mergeEnvMaps({ A: '1', B: '2' }, { B: '3', C: '4' });
    expect(result).toEqual({ A: '1', B: '3', C: '4' });
  });

  it('returns empty object when no maps are provided', () => {
    expect(mergeEnvMaps()).toEqual({});
  });

  it('does not mutate input maps', () => {
    const first = { A: '1' };
    const second = { A: '2' };
    mergeEnvMaps(first, second);
    expect(first.A).toBe('1');
  });
});

describe('applyStageOverrides', () => {
  it('applies overrides from a known stage', () => {
    const base = { LOG_LEVEL: 'info', APP_NAME: 'envchain' };
    const result = applyStageOverrides(base, 'staging', baseConfig);
    expect(result.LOG_LEVEL).toBe('debug');
    expect(result.APP_NAME).toBe('envchain');
  });

  it('returns base unchanged when stage has no overrides', () => {
    const config: EnvChainConfig = { stages: { prod: {} } };
    const base = { KEY: 'value' };
    const result = applyStageOverrides(base, 'prod', config);
    expect(result).toEqual({ KEY: 'value' });
  });
});

describe('resolveStageEnv', () => {
  it('resolves a stage with no inheritance', () => {
    const result = resolveStageEnv('base', baseConfig);
    expect(result).toEqual({ APP_NAME: 'envchain', LOG_LEVEL: 'info' });
  });

  it('resolves inherited stage values correctly', () => {
    const result = resolveStageEnv('staging', baseConfig);
    expect(result.APP_NAME).toBe('envchain');
    expect(result.LOG_LEVEL).toBe('debug');
    expect(result.API_URL).toBe('https://staging.example.com');
  });

  it('throws for an undefined stage', () => {
    expect(() => resolveStageEnv('unknown', baseConfig)).toThrow(
      'Stage "unknown" is not defined in the config.'
    );
  });
});
