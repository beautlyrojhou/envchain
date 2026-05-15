import {
  loadHistory,
  filterHistory,
  formatHistoryEntry,
  HistoryEntry,
} from './history';

export interface HistoryArgs {
  file?: string;
  stage?: string;
  action?: string;
  limit?: number;
  json?: boolean;
}

export function parseHistoryArgs(argv: string[]): HistoryArgs {
  const args: HistoryArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--file' || arg === '-f') args.file = argv[++i];
    else if (arg === '--stage' || arg === '-s') args.stage = argv[++i];
    else if (arg === '--action' || arg === '-a') args.action = argv[++i];
    else if (arg === '--limit' || arg === '-n') args.limit = parseInt(argv[++i], 10);
    else if (arg === '--json') args.json = true;
  }
  return args;
}

export function runHistoryCommand(argv: string[]): void {
  const args = parseHistoryArgs(argv);
  const log = loadHistory(args.file);
  let entries: HistoryEntry[] = filterHistory(log, args.stage, args.action);

  if (args.limit && args.limit > 0) {
    entries = entries.slice(-args.limit);
  }

  if (entries.length === 0) {
    console.log('No history entries found.');
    return;
  }

  if (args.json) {
    console.log(JSON.stringify(entries, null, 2));
  } else {
    for (const entry of entries) {
      console.log(formatHistoryEntry(entry));
    }
  }
}
