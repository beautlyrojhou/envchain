import { EnvConfig, EnvSchema, EnvStage, EnvValue } from './types';
import { validate } from './validator';

export class EnvChain {
  private stages: EnvStage[];
  private schema: EnvSchema;
  private configs: Map<EnvStage, Record<string, EnvValue>>;

  constructor(stages: EnvStage[], schema: EnvSchema) {
    if (stages.length === 0) throw new Error('At least one stage is required');
    this.stages = stages;
    this.schema = schema;
    this.configs = new Map();
  }

  addStage(stage: EnvStage, values: Record<string, string>): this {
    if (!this.stages.includes(stage)) {
      throw new Error(`Unknown stage "${stage}". Registered stages: ${this.stages.join(', ')}`);
    }
    this.configs.set(stage, values);
    return this;
  }

  resolve(stage: EnvStage): EnvConfig {
    const stageIndex = this.stages.indexOf(stage);
    if (stageIndex === -1) throw new Error(`Unknown stage "${stage}"`);

    const merged: Record<string, EnvValue> = {};

    for (let i = 0; i <= stageIndex; i++) {
      const stageValues = this.configs.get(this.stages[i]) ?? {};
      Object.assign(merged, stageValues);
    }

    return { stage, schema: this.schema, values: merged };
  }

  validateStage(stage: EnvStage) {
    const config = this.resolve(stage);
    const result = validate(config);
    if (!result.valid) {
      const messages = result.errors.map((e) => `  - [${e.key}] ${e.message}`).join('\n');
      throw new Error(`Validation failed for stage "${stage}":\n${messages}`);
    }
    return result;
  }
}
