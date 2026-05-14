import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { watchEnvFiles, WatchEvent } from './watcher';

function writeTmp(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('watchEnvFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-watch-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns a handle with stop and files', () => {
    const file = writeTmp(tmpDir, '.env', 'A=1\n');
    const handle = watchEnvFiles([file], jest.fn(), 50);
    expect(handle.files).toContain(file);
    expect(typeof handle.stop).toBe('function');
    handle.stop();
  });

  it('calls callback with previous and current env on file change', (done) => {
    const file = writeTmp(tmpDir, '.env.watch', 'FOO=bar\n');
    const events: WatchEvent[] = [];

    const handle = watchEnvFiles(
      [file],
      (evt) => {
        events.push(evt);
        if (events.length >= 1) {
          handle.stop();
          expect(events[0].previous).toEqual({ FOO: 'bar' });
          expect(events[0].current).toEqual({ FOO: 'baz' });
          expect(events[0].file).toBe(path.resolve(file));
          expect(events[0].timestamp).toBeInstanceOf(Date);
          done();
        }
      },
      80
    );

    setTimeout(() => {
      fs.writeFileSync(file, 'FOO=baz\n', 'utf8');
    }, 50);
  }, 5000);

  it('handles missing file gracefully on initial load', () => {
    const missing = path.join(tmpDir, 'nonexistent.env');
    expect(() => {
      const handle = watchEnvFiles([missing], jest.fn(), 50);
      handle.stop();
    }).not.toThrow();
  });
});
