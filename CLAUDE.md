# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Agency is a TypeScript library that translates LLM message formats between AI providers (Anthropic ↔ OpenAI). The library provides bidirectional translation of messages and tool definitions with full fidelity while maintaining type safety.

## Commands

### Development
- `npm run dev` - Build in watch mode
- `npm run build` - Production build (ESM + CJS + types)
- `npm run clean` - Remove dist directory

### Testing & Quality
- `npm test` - Run test suite with Vitest  
- `npm run test:coverage` - Run tests with coverage report (95% threshold)
- `npm run typecheck` - TypeScript type checking
- `npm run lint` - Lint with Biome
- `npm run format` - Format code with Biome

### Publishing
- `npm run prepublishOnly` - Clean and build for publishing
- `npm run publish:github` - Publish to GitHub Packages

### Running Single Tests
- `npm test anthropic.test.ts` - Run specific test file
- `npm test -- --reporter=verbose` - Verbose test output

### E2E Testing
- `npm run test:e2e` - Run E2E tests (requires API keys in .env.local)
- `VERBOSE=true npm run test:e2e` - Full JSON logs for debugging
- `npm run test:e2e -- -t "Vercel"` - Run specific E2E test

## Architecture

### Core Structure
- `src/index.ts` - Main exports and `agency` namespace
- `src/providers/` - Format conversion logic
  - `anthropic.ts` - Anthropic ↔ OpenAI conversion functions
  - `openai.ts` - Wrapper functions (delegates to anthropic.ts)
- `src/types/` - TypeScript definitions for both providers
- `src/core/` - Utilities and error handling

### Key Design Patterns
- **Provider symmetry**: Both providers expose identical APIs (`toAnthropic`/`toOpenAI`, `toolsToAnthropic`/`toolsToOpenAI`)
- **Delegation pattern**: OpenAI provider delegates to Anthropic provider for actual conversion logic
- **Error handling**: Custom error classes (`ValidationError`, `TransformError`) with provider context
- **Type safety**: Full TypeScript definitions for both OpenAI and Anthropic message formats

### Message Translation Flow
1. **OpenAI → Anthropic**: `openai.toAnthropic()` → `anthropic.fromOpenAI()`
2. **Anthropic → OpenAI**: `anthropic.toOpenAI()` directly
3. **Tool calling**: Automatic conversion between `tool_calls`/`tool` (OpenAI) and `tool_use`/`tool_result` (Anthropic)
4. **System messages**: OpenAI system messages are handled but not directly translated (stored for context)

## Configuration Details

### Build Setup (tsup)
- Outputs ESM and CJS formats with TypeScript declarations
- Tree-shaking enabled, minification for production
- Sourcemaps generated

### Testing (Vitest)
- Node environment with globals enabled
- V8 coverage provider with 95% threshold requirement
- HTML coverage reports generated in `coverage/`

### Code Quality (Biome)
- 2-space indentation, 100-char line width
- Strict linting rules including complexity checks
- Array shorthand syntax enforced (`T[]` not `Array<T>`)