import { describe, it, expect } from 'vitest';
import {
  validateSchema,
  applyDefaults,
  formatSchemaReport,
  EnvSchema,
} from './schemaValidator';

const schema: EnvSchema = {
  PORT: { type: 'number', required: true },
  APP_URL: { type: 'url', required: true },
  ADMIN_EMAIL: { type: 'email', required: false },
  DEBUG: { type: 'boolean', default: 'false' },
  APP_NAME: { type: 'string', required: false, pattern: /^[a-z_]+$/ },
};

describe('validateSchema', () => {
  it('passes with valid env', () => {
    const result = validateSchema(
      { PORT: '3000', APP_URL: 'https://example.com', DEBUG: 'true' },
      schema
    );
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('reports missing required keys', () => {
    const result = validateSchema({}, schema);
    expect(result.missing).toContain('PORT');
    expect(result.missing).toContain('APP_URL');
    expect(result.valid).toBe(false);
  });

  it('reports type errors for invalid number', () => {
    const result = validateSchema({ PORT: 'abc', APP_URL: 'https://x.com' }, schema);
    expect(result.typeErrors.some((e) => e.key === 'PORT')).toBe(true);
    expect(result.valid).toBe(false);
  });

  it('reports type error for invalid url', () => {
    const result = validateSchema({ PORT: '8080', APP_URL: 'not-a-url' }, schema);
    expect(result.typeErrors.some((e) => e.key === 'APP_URL')).toBe(true);
  });

  it('reports pattern errors', () => {
    const result = validateSchema(
      { PORT: '3000', APP_URL: 'https://x.com', APP_NAME: 'My App!' },
      schema
    );
    expect(result.patternErrors.some((e) => e.key === 'APP_NAME')).toBe(true);
  });

  it('treats optional missing keys as valid', () => {
    const result = validateSchema({ PORT: '3000', APP_URL: 'https://x.com' }, schema);
    expect(result.missing).not.toContain('ADMIN_EMAIL');
  });
});

describe('applyDefaults', () => {
  it('fills in default values', () => {
    const result = applyDefaults({ PORT: '3000', APP_URL: 'https://x.com' }, schema);
    expect(result.DEBUG).toBe('false');
  });

  it('does not override existing values', () => {
    const result = applyDefaults({ PORT: '3000', APP_URL: 'https://x.com', DEBUG: 'true' }, schema);
    expect(result.DEBUG).toBe('true');
  });
});

describe('formatSchemaReport', () => {
  it('returns success message when valid', () => {
    const msg = formatSchemaReport({ valid: true, missing: [], typeErrors: [], patternErrors: [] });
    expect(msg).toBe('Schema validation passed.');
  });

  it('includes missing and type error info', () => {
    const msg = formatSchemaReport({
      valid: false,
      missing: ['PORT'],
      typeErrors: [{ key: 'APP_URL', expected: 'url', actual: 'string' }],
      patternErrors: [],
    });
    expect(msg).toContain('PORT');
    expect(msg).toContain('APP_URL');
  });
});
