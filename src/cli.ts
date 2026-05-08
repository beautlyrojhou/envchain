import { loadEnv } from './loader';
import { resolveStageEnv } from './merger';
import { runPipeline } from './pipeline';
import { diffEnvMaps, formatDiff } from './differ';

export interface CliArgs {
  command: string;
  stage?: string;
  baseStage?: string;
  files: string[];
  format?: string;
  showUnchanged?: boolean;
  output?: string;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { command: 'run', files: [] };
  const rest = argv.slice(2);

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === 'diff') {
      args.command = 'diff';
    } else if (arg === 'run') {
      args.command = 'run';
    } else if (arg === '--stage' || arg === '-s') {
      args.stage = rest[++i];
    } else if (arg === '--base') {
      args.baseStage = rest[++i];
    } else if (arg === '--format' || arg === '-f') {
      args.format = rest[++i];
    } else if (arg === '--output' || arg === '-o') {
      args.output = rest[++i];
    } else if (arg === '--show-unchanged') {
      args.showUnchanged = true;
    } else if (!arg.startsWith('-')) {
      args.files.push(arg);
    }
  }

  return args;
}

export async function main(argv: string[] = process.argv): Promise<void> {
  const args = parseArgs(argv);

  if (args.command === 'diff') {
    const baseStage = args.baseStage ?? 'base';
    const targetStage = args.stage ?? 'production';
    const baseEnv = await loadEnv(args.files);
    const base = resolveStageEnv(baseEnv, baseStage);
    const target = resolveStageEnv(baseEnv, targetStage);
    const diff = diffEnvMaps(base, target);
    console.log(formatDiff(diff, args.showUnchanged ?? false));
    return;
  }

  await runPipeline({
    files: args.files,
    stage: args.stage,
    format: args.format as any,
    output: args.output,
  });
}
