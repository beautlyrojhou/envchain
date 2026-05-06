import * as fs from 'fs';
import * as path from 'path';
import { loadEnv, loadEnvFile, resolveEnvFile } from './loader';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('resolveEnvFile', () => {
  it('returns custom path when provided', () => {
    expect(resolveEnvFile('production', '.env.custom')).toBe('.env.custom');
  });

  it('returns stage-specific file for development', () => {
    expect(resolveEnvFile('development')).toBe('.env.development');
  });

  it('returns stage-specific file for staging', () => {
    expect(resolveEnvFile('staging')).toBe('.env.staging');
  });

  it('returns stage-specific file for production', () => {
    expect(resolveEnvFile('production')).toBe('.env.production');
  });
});

describe('loadEnvFile', () => {
  it('returns empty object if file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);
    expect(loadEnvFile('.env.missing')).toEqual({});
  });

  it('parses env file and returns key-value pairs', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('API_KEY=abc123\nPORT=3000' as any);
    const result = loadEnvFile('.env.development');
    expect(result).toEqual({ API_KEY: 'abc123', PORT: '3000' });
  });
});

describe('loadEnv', () => {
  beforeEach(() => {
    delete process.env.API_KEY;
    delete process.env.PORT;
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('API_KEY=test_key\nPORT=8080' as any);
  });

  it('loads env vars without overriding existing process.env by default', () => {
    process.env.API_KEY = 'existing_key';
    loadEnv({ stage: 'development' });
    expect(process.env.API_KEY).toBe('existing_key');
    expect(process.env.PORT).toBe('8080');
  });

  it('overrides existing process.env when overrideExisting is true', () => {
    process.env.API_KEY = 'existing_key';
    loadEnv({ stage: 'development', overrideExisting: true });
    expect(process.env.API_KEY).toBe('test_key');
  });

  it('returns merged config object', () => {
    const config = loadEnv({ stage: 'staging' });
    expect(config).toMatchObject({ API_KEY: 'test_key', PORT: '8080' });
  });
});
