import { buildChangeReport, printChangeReport } from './watchReporter';
import { WatchEvent } from './watcher';

function makeEvent(previous: Record<string, string>, current: Record<string, string>): WatchEvent {
  return {
    file: '/app/.env',
    type: 'change',
    previous,
    current,
    timestamp: new Date('2024-06-01T12:00:00Z'),
  };
}

describe('buildChangeReport', () => {
  it('detects added keys', () => {
    const report = buildChangeReport(makeEvent({}, { NEW_KEY: 'val' }));
    expect(report.added).toContain('NEW_KEY');
    expect(report.removed).toHaveLength(0);
    expect(report.modified).toHaveLength(0);
  });

  it('detects removed keys', () => {
    const report = buildChangeReport(makeEvent({ OLD_KEY: 'v' }, {}));
    expect(report.removed).toContain('OLD_KEY');
    expect(report.added).toHaveLength(0);
  });

  it('detects modified keys', () => {
    const report = buildChangeReport(makeEvent({ A: '1' }, { A: '2' }));
    expect(report.modified).toContain('A');
  });

  it('includes timestamp and file', () => {
    const report = buildChangeReport(makeEvent({}, {}));
    expect(report.timestamp).toBe('2024-06-01T12:00:00.000Z');
    expect(report.file).toBe('/app/.env');
  });

  it('includes raw text when format is text', () => {
    const report = buildChangeReport(makeEvent({ X: '1' }, { X: '2' }), { format: 'text' });
    expect(typeof report.raw).toBe('string');
    expect(report.raw!.length).toBeGreaterThan(0);
  });

  it('returns no raw when format is json', () => {
    const report = buildChangeReport(makeEvent({ X: '1' }, { X: '2' }), { format: 'json' });
    expect(report.raw).toBeUndefined();
  });
});

describe('printChangeReport', () => {
  it('logs to console without throwing', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const report = buildChangeReport(makeEvent({ A: '1' }, { A: '2', B: 'new' }), { format: 'text' });
    expect(() => printChangeReport(report)).not.toThrow();
    spy.mockRestore();
  });
});
