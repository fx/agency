/**
 * Anthropic Claude API message format types
 */

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: AnthropicContent[];
}

export type AnthropicContent =
  | AnthropicTextContent
  | AnthropicToolUseContent
  | AnthropicToolResultContent;

export interface AnthropicTextContent {
  type: "text";
  text: string;
}

export interface AnthropicToolUseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AnthropicToolResultContent {
  type: "tool_result";
  tool_use_id: string;
  content?: string;
  is_error?: boolean;
}

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  tools?: AnthropicTool[];
  tool_choice?: "auto" | "any" | { type: "tool"; name: string };
  max_tokens: number;
  system?: string;
}

export interface AnthropicResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicContent[];
  model: string;
  stop_reason?: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use";
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
