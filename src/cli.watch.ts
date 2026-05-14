import { watchEnvFiles } from './watcher';
import { buildChangeReport, printChangeReport } from './watchReporter';
import { resolveStageFiles } from './resolver';

export interface WatchCommandOptions {
  stage?: string;
  dir?: string;
  redact?: boolean;
  format?: 'text' | 'json';
  debounce?: number;
}

export function runWatchCommand(options: WatchCommandOptions = {}): void {
  const {
    stage = 'development',
    dir = process.cwd(),
    redact = false,
    format = 'text',
    debounce = 300,
  } = options;

  const files = resolveStageFiles(stage, dir).filter(Boolean);

  if (files.length === 0) {
    console.warn(`[envchain:watch] No env files found for stage "${stage}" in ${dir}`);
    return;
  }

  console.log(`[envchain:watch] Watching ${files.length} file(s) for stage "${stage}":`);
  files.forEach((f) => console.log(`  ${f}`));

  const handle = watchEnvFiles(
    files,
    (event) => {
      const report = buildChangeReport(event, { redact, format });
      if (format === 'json') {
        console.log(JSON.stringify(report, null, 2));
      } else {
        printChangeReport(report);
      }
    },
    debounce
  );

  process.on('SIGINT', () => {
    console.log('\n[envchain:watch] Stopped.');
    handle.stop();
    process.exit(0);
  });
}
