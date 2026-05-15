import * as fs from 'fs';
import * as path from 'path';
import { loadEnv } from './loader';
import { renderTemplate, extractTemplateKeys } from './templater';

export interface TemplateArgs {
  templateFile: string;
  envFile?: string;
  stage?: string;
  strict?: boolean;
  listKeys?: boolean;
}

export function parseTemplateArgs(argv: string[]): TemplateArgs {
  const args: TemplateArgs = { templateFile: '' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--template' || arg === '-t') args.templateFile = argv[++i];
    else if (arg === '--env' || arg === '-e') args.envFile = argv[++i];
    else if (arg === '--stage' || arg === '-s') args.stage = argv[++i];
    else if (arg === '--strict') args.strict = true;
    else if (arg === '--list-keys') args.listKeys = true;
    else if (!args.templateFile) args.templateFile = arg;
  }
  return args;
}

export async function runTemplateCommand(args: TemplateArgs): Promise<void> {
  if (!args.templateFile) {
    console.error('Error: --template <file> is required');
    process.exit(1);
  }

  const templatePath = path.resolve(args.templateFile);
  if (!fs.existsSync(templatePath)) {
    console.error(`Error: template file not found: ${templatePath}`);
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');

  if (args.listKeys) {
    const keys = extractTemplateKeys(template);
    if (keys.length === 0) {
      console.log('No template keys found.');
    } else {
      console.log('Template keys:');
      keys.forEach((k) => console.log(`  - ${k}`));
    }
    return;
  }

  const envFile = args.envFile ?? '.env';
  const env = await loadEnv(envFile, args.stage);

  try {
    const rendered = renderTemplate(template, env, { strict: args.strict });
    process.stdout.write(rendered);
  } catch (err: any) {
    console.error(`Template render error: ${err.message}`);
    process.exit(1);
  }
}
