/**
 * Common types shared across providers
 */

export type Provider = "anthropic" | "openai";

export type Role = "system" | "user" | "assistant" | "tool";

export interface BaseMessage {
  role: Role;
  content: string | MessageContent[];
}

export interface MessageContent {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
}

export interface BaseTool {
  name: string;
  description: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  id: string;
  result: unknown;
  error?: string;
}

export interface TranslationError extends Error {
  provider: Provider;
  originalData: unknown;
}

export interface TranslationOptions {
  strict?: boolean;
  preserveIds?: boolean;
}
