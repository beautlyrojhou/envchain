/**
 * cli.sort.ts — CLI handler for the sort command
 */

import * as fs from 'fs';
import { loadEnvFile } from './loader';
import { sortEnvMap, SortOptions, extractPrefixes } from './sorter';
import { formatDotenv } from './formatter';

export interface SortArgs {
  file: string;
  order?: 'asc' | 'desc';
  groupByPrefix?: boolean;
  delimiter?: string;
  listPrefixes?: boolean;
  output?: string;
}

export function parseSortArgs(argv: string[]): SortArgs {
  const args: SortArgs = { file: '' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--order' || arg === '-o') args.order = argv[++i] as 'asc' | 'desc';
    else if (arg === '--group-by-prefix' || arg === '-g') args.groupByPrefix = true;
    else if (arg === '--delimiter' || arg === '-d') args.delimiter = argv[++i];
    else if (arg === '--list-prefixes') args.listPrefixes = true;
    else if (arg === '--output') args.output = argv[++i];
    else if (!arg.startsWith('-')) args.file = arg;
  }
  return args;
}

export function runSortCommand(argv: string[]): void {
  const args = parseSortArgs(argv);

  if (!args.file) {
    console.error('Error: no input file specified');
    process.exit(1);
  }

  const env = loadEnvFile(args.file);

  if (args.listPrefixes) {
    const prefixes = extractPrefixes(env, args.delimiter);
    prefixes.forEach((p) => console.log(p));
    return;
  }

  const options: SortOptions = {
    order: args.order ?? 'asc',
    groupByPrefix: args.groupByPrefix ?? false,
    prefixDelimiter: args.delimiter ?? '_',
  };

  const sorted = sortEnvMap(env, options);
  const output = formatDotenv(sorted);

  if (args.output) {
    fs.writeFileSync(args.output, output, 'utf-8');
    console.log(`Sorted env written to ${args.output}`);
  } else {
    process.stdout.write(output);
  }
}
