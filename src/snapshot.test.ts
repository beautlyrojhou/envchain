import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  computeChecksum,
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
} from './snapshot';

const sampleEnv = { API_KEY: 'abc123', PORT: '3000', NODE_ENV: 'production' };

describe('computeChecksum', () => {
  it('returns a 16-char hex string', () => {
    const cs = computeChecksum(sampleEnv);
    expect(cs).toHaveLength(16);
    expect(cs).toMatch(/^[0-9a-f]+$/);
  });

  it('is deterministic for same input', () => {
    expect(computeChecksum(sampleEnv)).toBe(computeChecksum({ ...sampleEnv }));
  });

  it('differs when env changes', () => {
    const cs1 = computeChecksum(sampleEnv);
    const cs2 = computeChecksum({ ...sampleEnv, PORT: '4000' });
    expect(cs1).not.toBe(cs2);
  });
});

describe('createSnapshot', () => {
  it('creates a snapshot with expected fields', () => {
    const snap = createSnapshot('production', sampleEnv);
    expect(snap.stage).toBe('production');
    expect(snap.env).toEqual(sampleEnv);
    expect(snap.id).toBeTruthy();
    expect(snap.timestamp).toBeTruthy();
    expect(snap.checksum).toHaveLength(16);
  });
});

describe('saveSnapshot / loadSnapshot', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-snap-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('saves and reloads a snapshot correctly', () => {
    const snap = createSnapshot('staging', sampleEnv);
    const filepath = saveSnapshot(snap, tmpDir);
    expect(fs.existsSync(filepath)).toBe(true);
    const loaded = loadSnapshot(filepath);
    expect(loaded).toEqual(snap);
  });
});

describe('listSnapshots', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-list-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array for missing dir', () => {
    expect(listSnapshots('/nonexistent/path')).toEqual([]);
  });

  it('lists snapshots filtered by stage', () => {
    saveSnapshot(createSnapshot('prod', sampleEnv), tmpDir);
    saveSnapshot(createSnapshot('staging', sampleEnv), tmpDir);
    const prodSnaps = listSnapshots(tmpDir, 'prod');
    expect(prodSnaps).toHaveLength(1);
    expect(prodSnaps[0]).toContain('prod');
  });
});
