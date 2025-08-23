/**
 * Agency - Translate LLM message formats between providers
 *
 * @example
 * ```ts
 * import { agency } from 'agency';
 *
 * // Convert OpenAI messages to Anthropic format
 * const anthropicMessages = agency.openai.toAnthropic(openaiMessages);
 *
 * // Convert Anthropic messages to OpenAI format
 * const openaiMessages = agency.anthropic.toOpenAI(anthropicMessages);
 * ```
 */

export * from "./types/index.js";
export * from "./core/errors.js";
export * as anthropic from "./providers/anthropic.js";
export * as openai from "./providers/openai.js";

// Main namespace export
import * as anthropicProvider from "./providers/anthropic.js";
import * as openaiProvider from "./providers/openai.js";

export const agency = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
};
