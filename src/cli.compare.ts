import * as fs from 'fs';
import * as path from 'path';
import { loadEnv } from './loader';
import { compareEnvMaps, formatCompareResult } from './comparator';

export interface CompareArgs {
  fileA: string;
  fileB: string;
  format: 'text' | 'json';
  redact: boolean;
}

export function parseCompareArgs(argv: string[]): CompareArgs {
  const args = argv.slice(2);
  const format = args.includes('--json') ? 'json' : 'text';
  const redact = args.includes('--redact');
  const files = args.filter(a => !a.startsWith('--'));

  if (files.length < 2) {
    console.error('Usage: envchain compare <fileA> <fileB> [--json] [--redact]');
    process.exit(1);
  }

  return { fileA: files[0], fileB: files[1], format, redact };
}

export async function runCompareCommand(argv: string[]): Promise<void> {
  const { fileA, fileB, format, redact } = parseCompareArgs(argv);

  const resolveFile = (f: string) =>
    path.isAbsolute(f) ? f : path.resolve(process.cwd(), f);

  const pathA = resolveFile(fileA);
  const pathB = resolveFile(fileB);

  if (!fs.existsSync(pathA)) {
    console.error(`File not found: ${pathA}`);
    process.exit(1);
  }
  if (!fs.existsSync(pathB)) {
    console.error(`File not found: ${pathB}`);
    process.exit(1);
  }

  const envA = loadEnv(pathA);
  const envB = loadEnv(pathB);
  const result = compareEnvMaps(envA, envB);

  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatCompareResult(result, redact));
  }

  if (result.score < 100) {
    process.exit(1);
  }
}
