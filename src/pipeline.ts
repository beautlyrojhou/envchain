import { loadEnv } from './loader';
import { resolveStageEnv } from './merger';
import { validate } from './validator';
import { formatEnv } from './formatter';
import type { EnvSchema, EnvMap, FormatType } from './types';

export interface PipelineOptions {
  stages: string[];
  schema?: EnvSchema;
  format?: FormatType;
  envDir?: string;
  baseFile?: string;
}

export interface PipelineResult {
  env: EnvMap;
  output: string;
  errors: string[];
  stage: string;
}

export function runPipeline(
  currentStage: string,
  options: PipelineOptions
): PipelineResult {
  const {
    stages,
    schema = {},
    format = 'dotenv',
    envDir = '.',
    baseFile = '.env',
  } = options;

  if (!stages.includes(currentStage)) {
    throw new Error(
      `Stage "${currentStage}" is not in the defined stages: ${stages.join(', ')}`
    );
  }

  const stageIndex = stages.indexOf(currentStage);
  const activeStages = stages.slice(0, stageIndex + 1);

  const envMaps: EnvMap[] = activeStages.map((stage) =>
    loadEnv(envDir, baseFile, stage)
  );

  const resolved = resolveStageEnv(envMaps, activeStages);

  const errors: string[] = [];
  if (Object.keys(schema).length > 0) {
    try {
      validate(resolved, schema);
    } catch (err) {
      if (err instanceof Error) {
        errors.push(...err.message.split('\n').filter(Boolean));
      }
    }
  }

  const output = formatEnv(resolved, format);

  return { env: resolved, output, errors, stage: currentStage };
}
