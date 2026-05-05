# envchain

Lightweight tool to chain and validate environment configs across deployment stages.

## Installation

```bash
npm install envchain
```

## Usage

Define and validate your environment config across stages with a simple, chainable API.

```typescript
import { envchain } from 'envchain';

const config = envchain()
  .stage('development', {
    API_URL: { required: true, default: 'http://localhost:3000' },
    DEBUG: { required: false, default: 'true' },
  })
  .stage('production', {
    API_URL: { required: true },
    SECRET_KEY: { required: true },
    DEBUG: { required: false, default: 'false' },
  })
  .validate(process.env.NODE_ENV ?? 'development');

console.log(config.API_URL); // validated and typed
```

If a required variable is missing for the current stage, `envchain` throws a descriptive error at startup — before your app has a chance to misbehave.

```
Error: [envchain] Missing required variable "SECRET_KEY" in stage "production"
```

## Why envchain?

- ✅ Stage-aware validation (`development`, `staging`, `production`)
- ✅ Chainable, readable config definitions
- ✅ Fails fast with clear error messages
- ✅ Zero dependencies
- ✅ Fully typed with TypeScript

## License

MIT