import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { EnvConfig, Stage } from './types';

export interface LoadOptions {
  stage?: Stage;
  envFile?: string;
  overrideExisting?: boolean;
}

const STAGE_FILE_MAP: Record<Stage, string> = {
  development: '.env.development',
  staging: '.env.staging',
  production: '.env.production',
};

export function resolveEnvFile(stage: Stage, customPath?: string): string {
  if (customPath) return customPath;
  return STAGE_FILE_MAP[stage] ?? '.env';
}

export function loadEnvFile(filePath: string): Record<string, string> {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    return {};
  }
  const result = dotenv.parse(fs.readFileSync(resolved));
  return result;
}

export function loadEnv(options: LoadOptions = {}): EnvConfig {
  const stage: Stage = options.stage ?? (process.env.NODE_ENV as Stage) ?? 'development';
  const filePath = resolveEnvFile(stage, options.envFile);
  const fileVars = loadEnvFile(filePath);

  const merged: EnvConfig = { ...fileVars };

  if (options.overrideExisting) {
    Object.assign(process.env, merged);
  } else {
    for (const [key, value] of Object.entries(merged)) {
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }

  return merged;
}
