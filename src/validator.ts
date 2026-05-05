import { EnvConfig, EnvSchema, EnvValue, ValidationError, ValidationResult, ValidationWarning } from './types';

function coerceValue(raw: string, type: EnvSchema[string]['type']): EnvValue {
  if (type === 'number') {
    const n = Number(raw);
    return isNaN(n) ? null : n;
  }
  if (type === 'boolean') {
    return raw === 'true' || raw === '1';
  }
  return raw;
}

export function validate(config: EnvConfig): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const [key, rule] of Object.entries(config.schema)) {
    const stageScoped = rule.stages && !rule.stages.includes(config.stage);

    if (stageScoped) {
      if (key in config.values) {
        warnings.push({ key, message: `Key "${key}" is not expected in stage "${config.stage}"` });
      }
      continue;
    }

    const rawValue = config.values[key];

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      if (rule.required !== false && rule.default === undefined) {
        errors.push({ key, message: `Missing required environment variable "${key}"` });
      }
      continue;
    }

    const coerced = coerceValue(String(rawValue), rule.type);

    if (coerced === null) {
      errors.push({ key, message: `Invalid type for "${key}": expected ${rule.type}` });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
