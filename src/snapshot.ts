import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { EnvMap } from './types';

export interface Snapshot {
  id: string;
  timestamp: string;
  stage: string;
  checksum: string;
  env: EnvMap;
}

export function computeChecksum(env: EnvMap): string {
  const sorted = Object.keys(env)
    .sort()
    .map((k) => `${k}=${env[k]}`)
    .join('\n');
  return crypto.createHash('sha256').update(sorted).digest('hex').slice(0, 16);
}

export function createSnapshot(stage: string, env: EnvMap): Snapshot {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    stage,
    checksum: computeChecksum(env),
    env,
  };
}

export function saveSnapshot(snapshot: Snapshot, dir: string): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filename = `${snapshot.stage}-${snapshot.timestamp.replace(/[:.]/g, '-')}.json`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2), 'utf-8');
  return filepath;
}

export function loadSnapshot(filepath: string): Snapshot {
  const raw = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(raw) as Snapshot;
}

export function listSnapshots(dir: string, stage?: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json') && (!stage || f.startsWith(stage)))
    .map((f) => path.join(dir, f))
    .sort();
}
