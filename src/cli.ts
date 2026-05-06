#!/usr/bin/env node
import { runPipeline, PipelineOptions } from './pipeline';

function parseArgs(argv: string[]): { stage: string; options: PipelineOptions } {
  const args = argv.slice(2);
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') && i + 1 < args.length) {
      const key = args[i].slice(2);
      flags[key] = args[++i];
    }
  }

  const stage = flags['stage'];
  if (!stage) {
    throw new Error('Missing required flag: --stage <name>');
  }

  const stages = flags['stages']
    ? flags['stages'].split(',')
    : ['development', 'staging', 'production'];

  const options: PipelineOptions = {
    stages,
    envDir: flags['env-dir'] ?? '.',
    baseFile: flags['base-file'] ?? '.env',
    format: (flags['format'] as PipelineOptions['format']) ?? 'dotenv',
  };

  return { stage, options };
}

function main(): void {
  try {
    const { stage, options } = parseArgs(process.argv);
    const result = runPipeline(stage, options);

    if (result.errors.length > 0) {
      console.error('[envchain] Validation warnings:');
      result.errors.forEach((e) => console.error(`  - ${e}`));
    }

    process.stdout.write(result.output + '\n');
  } catch (err) {
    if (err instanceof Error) {
      console.error(`[envchain] Error: ${err.message}`);
    }
    process.exit(1);
  }
}

main();
