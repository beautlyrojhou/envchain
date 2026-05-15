import { EnvMap } from './types';
import { ExportFormat } from './exporter';

export interface ExportSchema {
  stage: string;
  format: ExportFormat;
  timestamp: string;
  count: number;
  keys: string[];
}

export function buildExportSchema(env: EnvMap, stage: string, format: ExportFormat): ExportSchema {
  return {
    stage,
    format,
    timestamp: new Date().toISOString(),
    count: env.size,
    keys: Array.from(env.keys()).sort(),
  };
}

export function validateExportFormat(format: string): format is ExportFormat {
  return ['dotenv', 'json', 'export', 'raw'].includes(format);
}

export function summarizeExport(schema: ExportSchema): string {
  return `[${schema.stage}] ${schema.count} vars exported as ${schema.format} at ${schema.timestamp}`;
}
