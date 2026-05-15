import { runExportCommand } from './cli.export';
import * as pipeline from './pipeline';
import * as exporter from './exporter';
import { EnvMap } from './types';

const mockEnv: EnvMap = new Map([
  ['APP_ENV', 'test'],
  ['SECRET_KEY', 'abc123'],
]);

jest.mock('./pipeline');
jest.mock('./exporter');

const mockedPipeline = pipeline.runPipeline as jest.MockedFunction<typeof pipeline.runPipeline>;
const mockedExport = exporter.exportEnv as jest.MockedFunction<typeof exporter.exportEnv>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedPipeline.mockResolvedValue(mockEnv);
  mockedExport.mockImplementation(() => {});
});

describe('runExportCommand', () => {
  it('calls pipeline and exportEnv with dotenv format', async () => {
    await runExportCommand({ format: 'dotenv' });
    expect(mockedPipeline).toHaveBeenCalledWith(expect.objectContaining({ stage: 'development' }));
    expect(mockedExport).toHaveBeenCalledWith(
      expect.any(Map),
      expect.objectContaining({ format: 'dotenv' })
    );
  });

  it('passes output path when provided', async () => {
    await runExportCommand({ format: 'json', output: '/tmp/out.json' });
    expect(mockedExport).toHaveBeenCalledWith(
      expect.any(Map),
      expect.objectContaining({ outputPath: '/tmp/out.json' })
    );
  });

  it('redacts env when redact=true', async () => {
    await runExportCommand({ format: 'dotenv', redact: true });
    const calledEnv: EnvMap = mockedExport.mock.calls[0][0];
    const secretVal = calledEnv.get('SECRET_KEY');
    expect(secretVal).not.toBe('abc123');
  });

  it('uses provided stage', async () => {
    await runExportCommand({ format: 'export', stage: 'production' });
    expect(mockedPipeline).toHaveBeenCalledWith(expect.objectContaining({ stage: 'production' }));
  });

  it('passes pretty flag for json', async () => {
    await runExportCommand({ format: 'json', pretty: true });
    expect(mockedExport).toHaveBeenCalledWith(
      expect.any(Map),
      expect.objectContaining({ pretty: true })
    );
  });
});
