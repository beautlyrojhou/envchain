import { EnvMap } from './types';
import { formatDotenv, formatJson, formatExport, formatEnv } from './formatter';
import * as fs from 'fs';
import * as path from 'path';

export type ExportFormat = 'dotenv' | 'json' | 'export' | 'raw';

export interface ExportOptions {
  format: ExportFormat;
  outputPath?: string;
  pretty?: boolean;
}

export function renderEnv(env: EnvMap, options: ExportOptions): string {
  switch (options.format) {
    case 'dotenv':
      return formatDotenv(env);
    case 'json':
      return formatJson(env, options.pretty ?? false);
    case 'export':
      return formatExport(env);
    case 'raw':
      return formatEnv(env);
    default:
      throw new Error(`Unknown export format: ${options.format}`);
  }
}

export function exportEnv(env: EnvMap, options: ExportOptions): void {
  const rendered = renderEnv(env, options);
  if (options.outputPath) {
    const dir = path.dirname(options.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(options.outputPath, rendered, 'utf-8');
  } else {
    process.stdout.write(rendered + '\n');
  }
}

export function exportEnvToString(env: EnvMap, format: ExportFormat): string {
  return renderEnv(env, { format });
}
