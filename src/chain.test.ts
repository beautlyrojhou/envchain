import { EnvChain } from './chain';

const schema = {
  PORT: { type: 'number' as const, required: true },
  LOG_LEVEL: { type: 'string' as const, required: false, default: 'info' },
  SECRET: { type: 'string' as const, required: true, stages: ['production'] },
};

describe('EnvChain', () => {
  it('merges values across stages in order', () => {
    const chain = new EnvChain(['base', 'staging', 'production'], schema);
    chain
      .addStage('base', { PORT: '3000', LOG_LEVEL: 'debug' })
      .addStage('staging', { LOG_LEVEL: 'warn' })
      .addStage('production', { PORT: '443', SECRET: 'top-secret' });

    const config = chain.resolve('production');
    expect(config.values['PORT']).toBe('443');
    expect(config.values['LOG_LEVEL']).toBe('warn');
    expect(config.values['SECRET']).toBe('top-secret');
  });

  it('does not include later stage values when resolving earlier stage', () => {
    const chain = new EnvChain(['base', 'production'], schema);
    chain
      .addStage('base', { PORT: '3000' })
      .addStage('production', { PORT: '443', SECRET: 'top-secret' });

    const config = chain.resolve('base');
    expect(config.values['SECRET']).toBeUndefined();
    expect(config.values['PORT']).toBe('3000');
  });

  it('throws on unknown stage in addStage', () => {
    const chain = new EnvChain(['base'], schema);
    expect(() => chain.addStage('unknown', {})).toThrow('Unknown stage');
  });

  it('throws on unknown stage in resolve', () => {
    const chain = new EnvChain(['base'], schema);
    chain.addStage('base', { PORT: '3000' });
    expect(() => chain.resolve('unknown')).toThrow('Unknown stage');
  });

  it('throws validation error for invalid stage config', () => {
    const chain = new EnvChain(['base', 'production'], schema);
    chain
      .addStage('base', {})
      .addStage('production', { SECRET: 'key' });

    expect(() => chain.validateStage('production')).toThrow('Validation failed');
  });

  it('passes validation for a correctly configured stage', () => {
    const chain = new EnvChain(['base', 'production'], schema);
    chain
      .addStage('base', { PORT: '443' })
      .addStage('production', { SECRET: 'my-secret' });

    const result = chain.validateStage('production');
    expect(result.valid).toBe(true);
  });

  it('applies default value when key is missing from all stages', () => {
    const chain = new EnvChain(['base', 'production'], schema);
    chain
      .addStage('base', { PORT: '3000' })
      .addStage('production', { SECRET: 'top-secret' });

    const config = chain.resolve('production');
    expect(config.values['LOG_LEVEL']).toBe('info');
  });
});
