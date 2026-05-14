import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SnapshotManager } from './snapshotManager';

const envA: Record<string, string> = { HOST: 'localhost', PORT: '3000' };
const envB: Record<string, string> = { HOST: 'prod.example.com', PORT: '443' };

let tmpDir: string;
let manager: SnapshotManager;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-mgr-'));
  manager = new SnapshotManager({ dir: tmpDir });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('SnapshotManager.capture', () => {
  it('captures and persists a snapshot', () => {
    const snap = manager.capture('dev', envA);
    expect(snap.stage).toBe('dev');
    expect(manager.list('dev')).toHaveLength(1);
  });
});

describe('SnapshotManager.latest', () => {
  it('returns null when no snapshots exist', () => {
    expect(manager.latest('dev')).toBeNull();
  });

  it('returns the most recent snapshot', () => {
    manager.capture('dev', envA);
    const snap = manager.capture('dev', envB);
    const latest = manager.latest('dev');
    expect(latest?.id).toBe(snap.id);
  });
});

describe('SnapshotManager.hasChanged', () => {
  it('returns true when no previous snapshot exists', () => {
    expect(manager.hasChanged('prod', envA)).toBe(true);
  });

  it('returns false when env is unchanged', () => {
    manager.capture('prod', envA);
    expect(manager.hasChanged('prod', { ...envA })).toBe(false);
  });

  it('returns true when env has changed', () => {
    manager.capture('prod', envA);
    expect(manager.hasChanged('prod', envB)).toBe(true);
  });
});

describe('SnapshotManager.compare', () => {
  it('returns a diff string between two snapshots', () => {
    const s1 = manager.capture('staging', envA);
    const s2 = manager.capture('staging', envB);
    const files = manager.list('staging');
    const diff = manager.compare(files[0], files[1]);
    expect(typeof diff).toBe('string');
    expect(diff.length).toBeGreaterThan(0);
  });
});
