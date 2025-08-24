/**
 * Anthropic Claude API message format types using official SDK
 * 
 * This file imports types from the official @anthropic-ai/sdk and provides
 * compatibility aliases to maintain backward compatibility.
 */

// Import types from the official Anthropic SDK
import type {
  Message,
  MessageParam,
  ContentBlock,
  TextBlock,
  TextBlockParam,
  ImageBlockParam,
  ToolUseBlock,
  ToolUseBlockParam,
  ToolResultBlockParam,
  Tool,
  ToolChoice,
  MessageCreateParams,
  Usage,
} from "@anthropic-ai/sdk/resources/messages.js";

// Define our own message structure to match our usage patterns
export interface AnthropicMessage {
  role: "user" | "assistant";
  content: AnthropicContent[];
}

// Union of all possible content types we use
export type AnthropicContent = 
  | AnthropicTextContent 
  | AnthropicToolUseContent 
  | AnthropicToolResultContent;

// Re-export SDK types with original names for compatibility
export type AnthropicTextContent = TextBlock;
export type AnthropicToolUseContent = ToolUseBlock;
export type AnthropicToolResultContent = ToolResultBlockParam;

// Tool type with required description (our API expects it)
export interface AnthropicTool extends Omit<Tool, 'description'> {
  description: string; // Make description required
}

// Request type based on MessageCreateParams but matching our structure
export interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  tools?: AnthropicTool[];
  tool_choice?: "auto" | "any" | { type: "tool"; name: string };
  max_tokens: number;
  system?: string;
}

// Response type based on SDK Message
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
