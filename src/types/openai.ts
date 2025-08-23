/**
 * OpenAI Chat Completions API message format types
 */

export interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  name?: string;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

export interface OpenAIToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
    strict?: boolean;
  };
}

export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  tools?: OpenAITool[];
  tool_choice?: "none" | "auto" | "required" | { type: "function"; function: { name: string } };
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface OpenAIResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIChoice {
  index: number;
  message: OpenAIMessage;
  logprobs?: unknown;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | "function_call";
}
