import * as fs from 'fs';
import * as path from 'path';
import { resolveCandidates, resolveStageFiles, pickFirstExisting } from './resolver';

jest.mock('fs');

const mockedExists = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

const CWD = '/project';

describe('resolveCandidates', () => {
  beforeEach(() => mockedExists.mockReset());

  it('returns matching files that exist', () => {
    mockedExists.mockImplementation((p) => p === '/project/.env');
    const result = resolveCandidates('.env', { cwd: CWD });
    expect(result).toEqual(['/project/.env']);
  });

  it('returns empty array when no files exist', () => {
    mockedExists.mockReturnValue(false);
    const result = resolveCandidates('.env', { cwd: CWD });
    expect(result).toEqual([]);
  });

  it('supports custom extensions', () => {
    mockedExists.mockImplementation((p) => p === '/project/.env.yaml');
    const result = resolveCandidates('.env', { cwd: CWD, extensions: ['.yaml', '.json'] });
    expect(result).toEqual(['/project/.env.yaml']);
  });

  it('does not duplicate when baseName already has extension', () => {
    mockedExists.mockImplementation((p) => p === '/project/.env');
    const result = resolveCandidates('.env', { cwd: CWD, extensions: ['.env'] });
    expect(result).toEqual(['/project/.env']);
  });
});

describe('resolveStageFiles', () => {
  beforeEach(() => mockedExists.mockReset());

  it('returns base and stage-specific files in order', () => {
    mockedExists.mockImplementation((p) =>
      ['/project/.env', '/project/.env.production'].includes(p as string)
    );
    const result = resolveStageFiles('production', { cwd: CWD });
    expect(result).toContain('/project/.env');
    expect(result).toContain('/project/.env.production');
    expect(result.indexOf('/project/.env')).toBeLessThan(
      result.indexOf('/project/.env.production')
    );
  });

  it('includes .local stage file if present', () => {
    mockedExists.mockImplementation((p) =>
      ['/project/.env', '/project/.env.staging', '/project/.env.staging.local'].includes(p as string)
    );
    const result = resolveStageFiles('staging', { cwd: CWD });
    expect(result).toContain('/project/.env.staging.local');
  });

  it('deduplicates repeated paths', () => {
    mockedExists.mockReturnValue(true);
    const result = resolveStageFiles('dev', { cwd: CWD });
    const unique = [...new Set(result)];
    expect(result).toEqual(unique);
  });
});

describe('pickFirstExisting', () => {
  beforeEach(() => mockedExists.mockReset());

  it('returns the first existing path', () => {
    mockedExists.mockImplementation((p) => p === '/project/.env.local');
    const result = pickFirstExisting(['/project/.env', '/project/.env.local']);
    expect(result).toBe('/project/.env.local');
  });

  it('throws when no path exists', () => {
    mockedExists.mockReturnValue(false);
    expect(() => pickFirstExisting(['/a', '/b'])).toThrow(/None of the candidate paths exist/);
  });
});
