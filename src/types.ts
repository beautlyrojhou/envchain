/**
 * types.ts
 * Shared type definitions for envchain.
 */

/** Core env map: a flat record of string key-value pairs */
export type EnvMap = Record<string, string>;

/** Supported output formats */
export type OutputFormat = 'dotenv' | 'json' | 'export';

/** Deployment stage identifier */
export type Stage = string;

/** Per-stage env overrides */
export type StageOverrides = Record<Stage, Partial<EnvMap>>;

/** Validation rule for a single key */
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean';
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
}

/** Schema maps keys to their validation rules */
export type EnvSchema = Record<string, ValidationRule>;

/** Result of a validation run */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Pipeline configuration */
export interface PipelineConfig {
  envFiles: string[];
  stage?: Stage;
  schema?: EnvSchema;
  outputFormat?: OutputFormat;
  redact?: boolean;
  encrypt?: boolean;
}
