import * as fs from 'fs';
import * as path from 'path';
import { loadEnv } from './loader';
import { lintEnv } from './linter';
import { formatLintResult, formatLintJson } from './lintFormatter';

export interface LintArgs {
  file: string;
  format: 'text' | 'json';
  failOnWarn: boolean;
}

export function parseLintArgs(argv: string[]): LintArgs {
  const args: LintArgs = {
    file: '.env',
    format: 'text',
    failOnWarn: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--file' || arg === '-f') && argv[i + 1]) {
      args.file = argv[++i];
    } else if (arg === '--format' && argv[i + 1]) {
      const fmt = argv[++i];
      if (fmt === 'json' || fmt === 'text') args.format = fmt;
    } else if (arg === '--fail-on-warn') {
      args.failOnWarn = true;
    }
  }
  return args;
}

export async function runLintCommand(argv: string[]): Promise<void> {
  const args = parseLintArgs(argv);
  const filePath = path.resolve(args.file);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const env = loadEnv(filePath);
  const result = lintEnv(env);

  if (args.format === 'json') {
    console.log(formatLintJson(result));
  } else {
    console.log(formatLintResult(result));
  }

  const shouldFail = !result.passed || (args.failOnWarn && result.warnCount > 0);
  if (shouldFail) {
    process.exit(1);
  }
}
