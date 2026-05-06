import { runPipeline } from './pipeline';
import * as loader from './loader';
import * as merger from './merger';
import * as validator from './validator';
import * as formatter from './formatter';

jest.mock('./loader');
jest.mock('./merger');
jest.mock('./validator');
jest.mock('./formatter');

const mockLoadEnv = loader.loadEnv as jest.MockedFunction<typeof loader.loadEnv>;
const mockResolve = merger.resolveStageEnv as jest.MockedFunction<typeof merger.resolveStageEnv>;
const mockValidate = validator.validate as jest.MockedFunction<typeof validator.validate>;
const mockFormat = formatter.formatEnv as jest.MockedFunction<typeof formatter.formatEnv>;

beforeEach(() => {
  jest.clearAllMocks();
  mockLoadEnv.mockReturnValue({ KEY: 'value' });
  mockResolve.mockReturnValue({ KEY: 'value', STAGE: 'production' });
  mockFormat.mockReturnValue('KEY=value\nSTAGE=production');
});

describe('runPipeline', () => {
  it('throws if currentStage is not in stages list', () => {
    expect(() =>
      runPipeline('unknown', { stages: ['dev', 'staging', 'production'] })
    ).toThrow('Stage "unknown" is not in the defined stages');
  });

  it('loads env for all stages up to and including current', () => {
    runPipeline('staging', { stages: ['dev', 'staging', 'production'] });
    expect(mockLoadEnv).toHaveBeenCalledTimes(2);
    expect(mockLoadEnv).toHaveBeenCalledWith('.', '.env', 'dev');
    expect(mockLoadEnv).toHaveBeenCalledWith('.', '.env', 'staging');
  });

  it('resolves merged env from active stages', () => {
    runPipeline('dev', { stages: ['dev', 'staging'] });
    expect(mockResolve).toHaveBeenCalledWith([{ KEY: 'value' }], ['dev']);
  });

  it('returns formatted output', () => {
    const result = runPipeline('production', {
      stages: ['dev', 'staging', 'production'],
      format: 'dotenv',
    });
    expect(result.output).toBe('KEY=value\nSTAGE=production');
    expect(result.stage).toBe('production');
  });

  it('captures validation errors without throwing', () => {
    mockValidate.mockImplementation(() => {
      throw new Error('Missing: REQUIRED_KEY\nInvalid: OTHER_KEY');
    });
    const result = runPipeline('dev', {
      stages: ['dev'],
      schema: { REQUIRED_KEY: { type: 'string', required: true } },
    });
    expect(result.errors).toContain('Missing: REQUIRED_KEY');
    expect(result.errors).toContain('Invalid: OTHER_KEY');
  });

  it('returns empty errors array when schema is empty', () => {
    const result = runPipeline('dev', { stages: ['dev'] });
    expect(result.errors).toHaveLength(0);
    expect(mockValidate).not.toHaveBeenCalled();
  });
});
