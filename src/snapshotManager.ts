import type { EnvMap } from './types';
import {
  Snapshot,
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  computeChecksum,
} from './snapshot';
import { diffEnvMaps, formatDiff } from './differ';

export interface SnapshotManagerOptions {
  dir: string;
}

export class SnapshotManager {
  private dir: string;

  constructor(options: SnapshotManagerOptions) {
    this.dir = options.dir;
  }

  capture(stage: string, env: EnvMap): Snapshot {
    const snapshot = createSnapshot(stage, env);
    saveSnapshot(snapshot, this.dir);
    return snapshot;
  }

  list(stage?: string): string[] {
    return listSnapshots(this.dir, stage);
  }

  load(filepath: string): Snapshot {
    return loadSnapshot(filepath);
  }

  latest(stage: string): Snapshot | null {
    const files = listSnapshots(this.dir, stage);
    if (files.length === 0) return null;
    return loadSnapshot(files[files.length - 1]);
  }

  compare(filepathA: string, filepathB: string): string {
    const a = loadSnapshot(filepathA);
    const b = loadSnapshot(filepathB);
    const diff = diffEnvMaps(a.env, b.env);
    return formatDiff(diff);
  }

  hasChanged(stage: string, currentEnv: EnvMap): boolean {
    const snap = this.latest(stage);
    if (!snap) return true;
    return snap.checksum !== computeChecksum(currentEnv);
  }
}
