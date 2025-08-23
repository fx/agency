# Agency

> Translate LLM message formats between providers (Anthropic ↔ OpenAI)

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## Install

```bash
# From GitHub Packages (replace 'your-org' with your GitHub org/username)
npm install @your-org/agency
```

> **Note**: This package is published to GitHub Packages, not the public npm registry. Make sure you have [configured npm to use GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) for the `@your-org` scope.

## Usage

```ts
import { agency } from '@your-org/agency';

// Convert OpenAI messages to Anthropic format
const anthropicMessages = agency.openai.toAnthropic(openaiMessages);

// Convert Anthropic messages to OpenAI format  
const openaiMessages = agency.anthropic.toOpenAI(anthropicMessages);

// Convert tools between formats
const anthropicTools = agency.openai.toolsToAnthropic(openaiTools);
const openaiTools = agency.anthropic.toolsToOpenAI(anthropicTools);
```

## Features

- **Bidirectional translation** between Anthropic and OpenAI message formats
- **Tool calling** format conversion with full fidelity 
- **Type-safe** with comprehensive TypeScript definitions
- **Zero-config** - works out of the box
- **Comprehensive testing** with >95% coverage
- **Compact** - minimal dependencies

## API

### Message Translation

```ts
import { anthropic, openai } from '@your-org/agency';

// Anthropic ↔ OpenAI
anthropic.toOpenAI(messages: AnthropicMessage[]): OpenAIMessage[]
openai.toAnthropic(messages: OpenAIMessage[]): AnthropicMessage[]

// Tool definitions
anthropic.toolsToOpenAI(tools: AnthropicTool[]): OpenAITool[]
openai.toolsToAnthropic(tools: OpenAITool[]): AnthropicTool[]
```

### Error Handling

```ts
import { AgencyError, ValidationError, TransformError } from '@your-org/agency';

try {
  const result = agency.openai.toAnthropic(messages);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  }
}
```

## Examples

### Basic Text Messages

```ts
const openaiMessages = [
  { role: 'user', content: 'Hello!' },
  { role: 'assistant', content: 'Hi there!' }
];

const anthropicMessages = agency.openai.toAnthropic(openaiMessages);
// Result: [
//   { role: 'user', content: [{ type: 'text', text: 'Hello!' }] },
//   { role: 'assistant', content: [{ type: 'text', text: 'Hi there!' }] }
// ]
```

### Tool Calling

```ts
const openaiWithTools = [
  { role: 'user', content: 'Read file README.md' },
  { 
    role: 'assistant',
    content: 'I'll read that file.',
    tool_calls: [{
      id: 'call_123',
      type: 'function',
      function: { name: 'read_file', arguments: '{"path":"README.md"}' }
    }]
  }
];

const anthropic = agency.openai.toAnthropic(openaiWithTools);
// Converts tool_calls to tool_use format automatically
```

## License

MIT