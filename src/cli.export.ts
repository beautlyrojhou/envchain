import { runPipeline } from './pipeline';
import { exportEnv, ExportFormat } from './exporter';
import { redactEnvMap } from './redactor';

export interface ExportCommandArgs {
  stage?: string;
  format: ExportFormat;
  output?: string;
  redact?: boolean;
  pretty?: boolean;
  files?: string[];
}

export async function runExportCommand(args: ExportCommandArgs): Promise<void> {
  const { stage = 'development', format, output, redact = false, pretty = false, files = [] } = args;

  let env = await runPipeline({ stage, files });

  if (redact) {
    env = redactEnvMap(env);
  }

  exportEnv(env, {
    format,
    outputPath: output,
    pretty,
  });

  if (output) {
    console.error(`Exported ${env.size} variable(s) to ${output} [${format}]`);
  }
}
