# E2E Agent Execution Testing Framework

A comprehensive framework for testing AI agent execution chains with structured logging and analysis capabilities.

## Overview

This framework enables systematic testing of AI agent behaviors by:
- Simulating claude-code interactions
- Supporting multiple AI providers (Anthropic, Vercel AI Gateway) 
- Providing detailed logging of all API interactions
- Analyzing execution patterns and performance

## Architecture

```
tests/e2e/
├── clients/           # API clients for different providers
├── scenarios/         # Test scenario definitions
├── utils/             # Logging and analysis utilities
├── types.ts           # TypeScript definitions
├── demo.ts            # Demonstration script
└── e2e.test.ts       # Vitest test suite
```

### Core Components

**API Clients**
- `AnthropicClient`: Direct Anthropic API integration
- `VercelClient`: Vercel AI Gateway integration
- Both clients provide structured logging and error handling

**Scenario System**
- `BaseScenario`: Abstract base class for test scenarios
- `ReadFileScenario`: Concrete scenario testing file reading behavior
- `ScenarioRunner`: Orchestrates scenario execution

**Logging & Analysis**
- `E2ELogger`: Captures all API interactions with timestamps
- `LogAnalyzer`: Analyzes execution patterns, performance, errors

## Usage

⚠️ **Important**: E2E tests require API keys and are excluded from the regular test suite.

### Running the Demo

```bash
npm run test:e2e:demo
```

### Running Tests

```bash
# Run framework tests (all mocked)  
npm run test:e2e framework.test.ts

# Run E2E tests against real APIs (requires API keys)
npm run test:e2e e2e.test.ts
```

### Creating Custom Scenarios

```typescript
import { BaseScenario, ScenarioConfig } from './scenarios/base-scenario';

export class CustomScenario extends BaseScenario {
  constructor() {
    const config: ScenarioConfig = {
      name: 'custom-test',
      description: 'Test custom behavior',
      systemPrompt: 'Your system prompt here...',
      initialMessage: 'Your test message',
      expectedBehavior: ['pattern1', 'pattern2'],
      timeout: 30000
    };
    super(config);
  }

  protected async runScenario(provider: 'anthropic' | 'vercel'): Promise<boolean> {
    const client = this.getClient(provider);
    // Implement your scenario logic
    const response = await client.sendMessage(/* ... */);
    return this.validateResponse(response.data, this.config.expectedBehavior);
  }
}
```

### Using the Framework

```typescript
import { ScenarioRunner } from './scenarios/scenario-runner';
import { CustomScenario } from './scenarios/custom-scenario';

const runner = new ScenarioRunner({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  vercelApiKey: process.env.VERCEL_API_KEY,
  timeout: 30000
});

const scenario = new CustomScenario();
const log = await runner.runScenario(scenario, 'anthropic');

console.log('Execution result:', log);
```

## Key Features

### Structured Logging
Every API call is logged with:
- Timestamp and duration
- Provider information
- Request/response data (sanitized)
- Error details if applicable

### Multi-Provider Support
- **Anthropic**: Direct Claude API access
- **Vercel AI Gateway**: Unified AI provider access

### Analysis Capabilities
- Success/failure rates
- Performance metrics
- Error categorization
- Tool usage patterns
- Conversation flow analysis

### Concurrent Execution
Support for running multiple scenarios in parallel with configurable concurrency limits.

### Error Handling
Graceful handling of:
- API timeouts
- Authentication errors
- Rate limiting
- Network failures

## Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-api03-...
VERCEL_API_KEY=vck_...
```

⚠️ **Security Note**: 
- API keys are required for E2E tests but should never be committed to version control
- The `.env.local` file is already gitignored for security
- E2E tests will fail with clear error messages if API keys are missing

### Runner Options
```typescript
interface RunnerConfig {
  anthropicApiKey?: string;
  vercelApiKey?: string;
  timeout?: number;        // Request timeout in ms
  concurrency?: number;    // Max concurrent scenarios
}
```

## Testing

The framework includes comprehensive tests covering:
- Basic scenario execution
- Multi-provider support
- Error handling
- Concurrent execution
- Structured logging validation

## Example Output

The framework provides detailed analysis reports:

```
# E2E Execution Analysis Report

## Summary
- Total Requests: 5
- Success Rate: 100.0%
- Average Response Time: 195ms
- Total Response Time: 1.0s

## Provider Usage
- anthropic: 3 requests
- vercel: 2 requests

## Tool Usage Patterns
- tool_invocation
- file_read
- command_execution

## Conversation Flow
- read-file:1calls:150ms:success
- complex-task:3calls:450ms:success
```

This framework enables systematic testing of AI agent behaviors with full observability into execution patterns and API interactions.