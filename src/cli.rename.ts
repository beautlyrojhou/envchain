/**
 * cli.rename.ts — CLI handler for the rename command
 */

import { loadEnv } from "./loader";
import { renameEnvMap, RenameRule, RenameOptions } from "./renamer";
import { formatEnv } from "./formatter";

export interface RenameArgs {
  file: string;
  prefix?: string;
  suffix?: string;
  stripPrefix?: string;
  rules?: string[]; // ["OLD=NEW", ...]
  format?: "dotenv" | "json" | "export";
}

function parseRuleStrings(ruleStrings: string[]): RenameRule[] {
  return ruleStrings.map((r) => {
    const eqIdx = r.indexOf("=");
    if (eqIdx < 1) throw new Error(`Invalid rename rule: "${r}" (expected OLD=NEW)`);
    return { from: r.slice(0, eqIdx), to: r.slice(eqIdx + 1) };
  });
}

export function parseRenameArgs(argv: string[]): RenameArgs {
  const args: RenameArgs = { file: "", format: "dotenv" };
  const rules: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--file" || arg === "-f") args.file = argv[++i];
    else if (arg === "--prefix") args.prefix = argv[++i];
    else if (arg === "--suffix") args.suffix = argv[++i];
    else if (arg === "--strip-prefix") args.stripPrefix = argv[++i];
    else if (arg === "--rule") rules.push(argv[++i]);
    else if (arg === "--format") args.format = argv[++i] as RenameArgs["format"];
  }

  if (!args.file) throw new Error("--file is required for the rename command");
  if (rules.length) args.rules = rules;
  return args;
}

export async function runRenameCommand(argv: string[]): Promise<void> {
  const args = parseRenameArgs(argv);

  const env = await loadEnv(args.file);

  const options: RenameOptions = {
    prefix: args.prefix,
    suffix: args.suffix,
    stripPrefix: args.stripPrefix,
    rules: args.rules ? parseRuleStrings(args.rules) : [],
  };

  const renamed = renameEnvMap(env, options);
  const output = formatEnv(renamed, args.format ?? "dotenv");
  process.stdout.write(output + "\n");
}
