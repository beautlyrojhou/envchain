import * as fs from 'fs';
import * as path from 'path';
import { loadEnv } from './loader';
import { EnvSchema, validateSchema, applyDefaults, formatSchemaReport } from './schemaValidator';

function loadSchemaFile(schemaPath: string): EnvSchema {
  const abs = path.resolve(schemaPath);
  if (!fs.existsSync(abs)) throw new Error(`Schema file not found: ${abs}`);
  const raw = fs.readFileSync(abs, 'utf-8');
  return JSON.parse(raw) as EnvSchema;
}

export interface SchemaCommandOptions {
  envFile?: string;
  schemaFile: string;
  applyDefaults?: boolean;
  outputFile?: string;
  quiet?: boolean;
}

export async function runSchemaCommand(opts: SchemaCommandOptions): Promise<boolean> {
  const envPath = opts.envFile ?? '.env';
  const env = await loadEnv(envPath);
  const schema = loadSchemaFile(opts.schemaFile);

  const working = opts.applyDefaults ? applyDefaults(env, schema) : env;
  const result = validateSchema(working, schema);
  const report = formatSchemaReport(result);

  if (!opts.quiet) {
    console.log(report);
  }

  if (opts.applyDefaults && opts.outputFile) {
    const lines = Object.entries(working)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    fs.writeFileSync(path.resolve(opts.outputFile), lines + '\n', 'utf-8');
    if (!opts.quiet) console.log(`Written to ${opts.outputFile}`);
  }

  if (!result.valid) {
    process.exitCode = 1;
    return false;
  }

  return true;
}

export function parseSchemaArgs(argv: string[]): SchemaCommandOptions {
  const opts: SchemaCommandOptions = { schemaFile: 'env.schema.json' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--schema' && argv[i + 1]) opts.schemaFile = argv[++i];
    else if (argv[i] === '--env' && argv[i + 1]) opts.envFile = argv[++i];
    else if (argv[i] === '--apply-defaults') opts.applyDefaults = true;
    else if (argv[i] === '--output' && argv[i + 1]) opts.outputFile = argv[++i];
    else if (argv[i] === '--quiet') opts.quiet = true;
  }
  return opts;
}
