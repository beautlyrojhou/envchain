import * as path from 'path';
import { SnapshotManager } from './snapshotManager';
import { loadEnv } from './loader';

const DEFAULT_SNAPSHOT_DIR = '.envchain/snapshots';

export function runSnapshotCommand(args: string[]): void {
  const [subcommand, ...rest] = args;

  const snapshotDir = process.env.ENVCHAIN_SNAPSHOT_DIR ?? DEFAULT_SNAPSHOT_DIR;
  const manager = new SnapshotManager({ dir: snapshotDir });

  switch (subcommand) {
    case 'capture': {
      const stage = rest[0] ?? 'default';
      const envFile = rest[1] ?? `.env.${stage}`;
      const env = loadEnv(envFile);
      const snap = manager.capture(stage, env);
      console.log(`Snapshot captured: ${snap.id} (${snap.checksum})`);
      break;
    }
    case 'list': {
      const stage = rest[0];
      const files = manager.list(stage);
      if (files.length === 0) {
        console.log('No snapshots found.');
      } else {
        files.forEach((f) => console.log(path.basename(f)));
      }
      break;
    }
    case 'diff': {
      const [fileA, fileB] = rest;
      if (!fileA || !fileB) {
        console.error('Usage: snapshot diff <fileA> <fileB>');
        process.exit(1);
      }
      const diff = manager.compare(fileA, fileB);
      console.log(diff || '(no differences)');
      break;
    }
    case 'check': {
      const stage = rest[0] ?? 'default';
      const envFile = rest[1] ?? `.env.${stage}`;
      const env = loadEnv(envFile);
      const changed = manager.hasChanged(stage, env);
      console.log(changed ? 'CHANGED' : 'UNCHANGED');
      process.exit(changed ? 1 : 0);
    }
    default:
      console.error(`Unknown snapshot subcommand: ${subcommand}`);
      console.error('Available: capture, list, diff, check');
      process.exit(1);
  }
}
