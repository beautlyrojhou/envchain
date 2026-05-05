import { validate } from './validator';
import { EnvConfig } from './types';

describe('validate', () => {
  const schema = {
    PORT: { type: 'number' as const, required: true },
    DEBUG: { type: 'boolean' as const, required: false, default: false },
    API_KEY: { type: 'string' as const, required: true, stages: ['production'] },
  };

  it('passes when all required fields are present and valid', () => {
    const config: EnvConfig = {
      stage: 'development',
      schema,
      values: { PORT: '3000', DEBUG: 'true' },
    };
    const result = validate(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when a required field is missing', () => {
    const config: EnvConfig = {
      stage: 'development',
      schema,
      values: { DEBUG: 'false' },
    };
    const result = validate(config);
    expect(result.valid).toBe(false);
    expect(result.errors[0].key).toBe('PORT');
  });

  it('fails when a number field has invalid value', () => {
    const config: EnvConfig = {
      stage: 'development',
      schema,
      values: { PORT: 'not-a-number' },
    };
    const result = validate(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.key === 'PORT')).toBe(true);
  });

  it('warns when a stage-scoped key is present in wrong stage', () => {
    const config: EnvConfig = {
      stage: 'development',
      schema,
      values: { PORT: '3000', API_KEY: 'secret' },
    };
    const result = validate(config);
    expect(result.warnings.some((w) => w.key === 'API_KEY')).toBe(true);
  });

  it('requires stage-scoped key in correct stage', () => {
    const config: EnvConfig = {
      stage: 'production',
      schema,
      values: { PORT: '443' },
    };
    const result = validate(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.key === 'API_KEY')).toBe(true);
  });
});
