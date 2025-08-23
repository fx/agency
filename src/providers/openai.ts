/**
 * OpenAI message format handlers
 */

import type {
  OpenAIMessage,
  OpenAITool,
  AnthropicMessage,
  AnthropicTool,
  TranslationOptions,
} from "../types/index.js";
import * as anthropic from "./anthropic.js";

/**
 * Convert Anthropic messages to OpenAI format
 */
export function fromAnthropic(
  messages: AnthropicMessage[],
  options: TranslationOptions = {}
): OpenAIMessage[] {
  return anthropic.toOpenAI(messages, options);
}

/**
 * Convert OpenAI messages to Anthropic format
 */
export function toAnthropic(
  messages: OpenAIMessage[],
  options: TranslationOptions = {}
): AnthropicMessage[] {
  return anthropic.fromOpenAI(messages, options);
}

/**
 * Convert Anthropic tools to OpenAI format
 */
export function toolsFromAnthropic(tools: AnthropicTool[]): OpenAITool[] {
  return anthropic.toolsToOpenAI(tools);
}

/**
 * Convert OpenAI tools to Anthropic format
 */
export function toolsToAnthropic(tools: OpenAITool[]): AnthropicTool[] {
  return anthropic.toolsFromOpenAI(tools);
}
