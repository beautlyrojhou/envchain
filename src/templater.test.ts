import { renderTemplate, renderEnvTemplate, extractTemplateKeys } from './templater';

describe('renderTemplate', () => {
  const env = { APP_NAME: 'envchain', VERSION: '1.0.0', EMPTY: '' };

  it('replaces known placeholders', () => {
    expect(renderTemplate('Hello from {{APP_NAME}} v{{VERSION}}', env)).toBe(
      'Hello from envchain v1.0.0'
    );
  });

  it('uses fallback for missing keys', () => {
    expect(renderTemplate('{{MISSING_KEY}}', env, { fallback: 'N/A' })).toBe('N/A');
  });

  it('uses empty string as default fallback', () => {
    expect(renderTemplate('{{MISSING_KEY}}', env)).toBe('');
  });

  it('throws in strict mode for missing keys', () => {
    expect(() => renderTemplate('{{MISSING_KEY}}', env, { strict: true })).toThrow(
      'Template key not found in env: MISSING_KEY'
    );
  });

  it('handles whitespace inside placeholders', () => {
    expect(renderTemplate('{{ APP_NAME }}', env)).toBe('envchain');
  });

  it('replaces empty string values correctly', () => {
    expect(renderTemplate('val={{EMPTY}}', env)).toBe('val=');
  });

  it('returns template unchanged if no placeholders', () => {
    expect(renderTemplate('no placeholders here', env)).toBe('no placeholders here');
  });
});

describe('renderEnvTemplate', () => {
  it('resolves self-referential env values', () => {
    const env = { BASE: 'http://localhost', URL: '{{BASE}}/api' };
    const result = renderEnvTemplate(env);
    expect(result.URL).toBe('http://localhost/api');
    expect(result.BASE).toBe('http://localhost');
  });

  it('leaves null/undefined values as-is', () => {
    const env: Record<string, string | undefined> = { KEY: undefined };
    const result = renderEnvTemplate(env as any);
    expect(result.KEY).toBeUndefined();
  });

  it('applies fallback for missing references', () => {
    const env = { GREETING: 'Hello {{NAME}}' };
    const result = renderEnvTemplate(env, { fallback: 'World' });
    expect(result.GREETING).toBe('Hello World');
  });
});

describe('extractTemplateKeys', () => {
  it('extracts all placeholder keys', () => {
    const keys = extractTemplateKeys('{{HOST}}:{{PORT}}/{{PATH}}');
    expect(keys).toEqual(['HOST', 'PORT', 'PATH']);
  });

  it('deduplicates repeated keys', () => {
    const keys = extractTemplateKeys('{{KEY}}-{{KEY}}');
    expect(keys).toEqual(['KEY']);
  });

  it('returns empty array for no placeholders', () => {
    expect(extractTemplateKeys('no placeholders')).toEqual([]);
  });
});
