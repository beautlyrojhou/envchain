import * as fs from 'fs';
import * as path from 'path';

export type ResolveStrategy = 'first' | 'merge' | 'override';

export interface ResolveOptions {
  strategy?: ResolveStrategy;
  cwd?: string;
  extensions?: string[];
}

const DEFAULT_EXTENSIONS = ['.env', '.env.local', '.env.defaults'];

/**
 * Resolves candidate env file paths based on a base name and known extensions.
 */
export function resolveCandidates(
  baseName: string,
  options: ResolveOptions = {}
): string[] {
  const cwd = options.cwd ?? process.cwd();
  const extensions = options.extensions ?? DEFAULT_EXTENSIONS;

  return extensions
    .map((ext) => path.resolve(cwd, baseName.endsWith(ext) ? baseName : `${baseName}${ext}`))
    .filter((filePath) => {
      try {
        return fs.existsSync(filePath);
      } catch {
        return false;
      }
    });
}

/**
 * Resolves env files for a given stage, returning ordered paths.
 * Looks for base .env, then stage-specific overrides.
 */
export function resolveStageFiles(
  stage: string,
  options: ResolveOptions = {}
): string[] {
  const cwd = options.cwd ?? process.cwd();
  const candidates: string[] = [];

  const baseCandidates = resolveCandidates('.env', options);
  candidates.push(...baseCandidates);

  const stagePath = path.resolve(cwd, `.env.${stage}`);
  if (fs.existsSync(stagePath)) {
    candidates.push(stagePath);
  }

  const localStagePath = path.resolve(cwd, `.env.${stage}.local`);
  if (fs.existsSync(localStagePath)) {
    candidates.push(localStagePath);
  }

  return [...new Set(candidates)];
}

/**
 * Given a list of resolved file paths, returns the first existing one
 * or throws if none are found.
 */
export function pickFirstExisting(filePaths: string[]): string {
  const found = filePaths.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(`None of the candidate paths exist: ${filePaths.join(', ')}`);
  }
  return found;
}
