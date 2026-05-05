export type EnvStage = string;

export type EnvValue = string | number | boolean | null;

export interface EnvSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean';
    required?: boolean;
    default?: EnvValue;
    stages?: EnvStage[];
  };
}

export interface EnvConfig {
  stage: EnvStage;
  schema: EnvSchema;
  values: Record<string, EnvValue>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  key: string;
  message: string;
}

export interface ValidationWarning {
  key: string;
  message: string;
}
