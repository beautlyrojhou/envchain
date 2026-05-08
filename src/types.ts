export type EnvMap = Record<string, string>;

export type EnvStage = 'development' | 'staging' | 'production' | string;

export interface EnvSchema {
  [key: string]: {
    type?: 'string' | 'number' | 'boolean';
    required?: boolean;
    default?: string;
    sensitive?: boolean;
    description?: string;
  };
}

export interface PipelineOptions {
  stage: EnvStage;
  schema?: EnvSchema;
  files?: string[];
  format?: 'dotenv' | 'json' | 'export';
  redact?: boolean;
  audit?: boolean;
}

export interface PipelineResult {
  env: EnvMap;
  output: string;
  warnings: string[];
  auditReport?: import('./auditor').AuditReport;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  coerced: EnvMap;
}
