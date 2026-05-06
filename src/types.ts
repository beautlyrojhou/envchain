export type Stage = 'development' | 'staging' | 'production';

export type EnvValue = string | number | boolean | undefined;

export type EnvConfig = Record<string, string>;

export type CoercedEnvConfig = Record<string, EnvValue>;

export type FieldType = 'string' | 'number' | 'boolean';

export interface FieldSchema {
  type: FieldType;
  required?: boolean;
  default?: EnvValue;
  description?: string;
}

export type EnvSchema = Record<string, FieldSchema>;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  values: CoercedEnvConfig;
}

export interface ChainOptions {
  schema: EnvSchema;
  stage?: Stage;
  envFile?: string;
  overrideExisting?: boolean;
  strict?: boolean;
}

export interface ChainResult {
  stage: Stage;
  config: CoercedEnvConfig;
  errors: string[];
  valid: boolean;
}
