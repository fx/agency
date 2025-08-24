/**
 * Anthropic message format handlers
 */

import type {
  AnthropicMessage,
  AnthropicContent,
  AnthropicTool,
  AnthropicToolUseContent,
  AnthropicToolResultContent,
  OpenAIMessage,
  OpenAITool,
  OpenAIToolCall,
  TranslationOptions,
} from "../types/index.js";
import { createError } from "../core/errors.js";
import { generateId, safeJsonParse, safeJsonStringify, isNonEmptyString } from "../core/utils.js";

/**
 * Convert OpenAI messages to Anthropic format
 */
export function fromOpenAI(
  messages: OpenAIMessage[],
  _options: TranslationOptions = {}
): AnthropicMessage[] {
  const result: AnthropicMessage[] = [];
  let _systemMessage = "";

  for (const msg of messages) {
    if (msg.role === "system") {
      _systemMessage = msg.content || "";
      continue;
    }

    if (msg.role === "tool") {
      // Tool result message - merge with previous assistant message
      if (result.length === 0 || result[result.length - 1]?.role !== "assistant") {
        throw createError(
          "validation",
          "Tool result without preceding assistant message",
          "anthropic",
          msg
        );
      }

      const lastMsg = result[result.length - 1];
      if (!lastMsg) {
        continue;
      }

      const toolResult: AnthropicToolResultContent = {
        type: "tool_result",
        tool_use_id: msg.tool_call_id || generateId(),
        content: msg.content || "",
        is_error: false,
      };

      if (Array.isArray(lastMsg.content)) {
        lastMsg.content.push(toolResult);
      } else {
        lastMsg.content = [{ type: "text", text: lastMsg.content }, toolResult];
      }
      continue;
    }

    const content: AnthropicContent[] = [];

    if (msg.content) {
      content.push({ type: "text", text: msg.content });
    }

    if (msg.tool_calls) {
      for (const toolCall of msg.tool_calls) {
        const toolUse: AnthropicToolUseContent = {
          type: "tool_use",
          id: toolCall.id,
          name: toolCall.function.name,
          input: safeJsonParse(toolCall.function.arguments, "anthropic"),
        };
        content.push(toolUse);
      }
    }

    if (content.length === 0) {
      throw createError("validation", "Message has no content", "anthropic", msg);
    }

    result.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content,
    });
  }

  return result;
}

/**
 * Convert Anthropic messages to OpenAI format
 */
export function toOpenAI(
  messages: AnthropicMessage[],
  _options: TranslationOptions = {}
): OpenAIMessage[] {
  const result: OpenAIMessage[] = [];

  for (const msg of messages) {
    const toolCalls: OpenAIToolCall[] = [];
    let textContent = "";
    let hasToolResult = false;

    for (const content of msg.content) {
      if (content.type === "text") {
        textContent += content.text;
      } else if (content.type === "tool_use") {
        toolCalls.push({
          id: content.id,
          type: "function",
          function: {
            name: content.name,
            arguments: safeJsonStringify(content.input, "openai"),
          },
        });
      } else if (content.type === "tool_result") {
        // Tool results become separate messages in OpenAI
        result.push({
          role: "tool",
          tool_call_id: content.tool_use_id,
          content:
            typeof content.content === "string"
              ? content.content
              : safeJsonStringify(content.content, "openai"),
        });
        hasToolResult = true;
      }
    }

    // Skip creating a message if it only contained tool results and has no other content
    if (hasToolResult && !textContent && toolCalls.length === 0) {
      continue;
    }

    const openaiMsg: OpenAIMessage = {
      role: msg.role,
      content: textContent || null,
    };

    if (toolCalls.length > 0) {
      openaiMsg.tool_calls = toolCalls;
    }

    result.push(openaiMsg);
  }

  return result;
}

/**
 * Convert OpenAI tools to Anthropic format
 */
export function toolsFromOpenAI(tools: OpenAITool[]): AnthropicTool[] {
  return tools.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: {
      type: "object" as const,
      properties: tool.function.parameters.properties,
      required: tool.function.parameters.required,
    },
  }));
}

/**
 * Convert Anthropic tools to OpenAI format
 */
export function toolsToOpenAI(tools: AnthropicTool[]): OpenAITool[] {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object" as const,
        properties: (tool.input_schema.properties as Record<string, unknown>) || {},
        required: (tool.input_schema.required as string[]) || undefined,
      },
    },
  }));
}
