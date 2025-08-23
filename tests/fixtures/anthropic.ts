/**
 * Anthropic message format test fixtures
 */

import type { AnthropicMessage, AnthropicTool } from "../../src/types/index.js";

export const simpleTextMessage: AnthropicMessage[] = [
  {
    role: "user",
    content: [{ type: "text", text: "Hello, how are you?" }],
  },
  {
    role: "assistant",
    content: [{ type: "text", text: "I'm doing well, thank you for asking!" }],
  },
];

export const toolCallMessage: AnthropicMessage[] = [
  {
    role: "user",
    content: [{ type: "text", text: "Read the file README.md" }],
  },
  {
    role: "assistant",
    content: [
      { type: "text", text: "I'll read the README.md file for you." },
      {
        type: "tool_use",
        id: "call_abc123",
        name: "read_file",
        input: { path: "README.md" },
      },
    ],
  },
];

export const toolResultMessage: AnthropicMessage[] = [
  {
    role: "user",
    content: [{ type: "text", text: "Read the file README.md" }],
  },
  {
    role: "assistant",
    content: [
      { type: "text", text: "I'll read the README.md file for you." },
      {
        type: "tool_use",
        id: "call_abc123",
        name: "read_file",
        input: { path: "README.md" },
      },
    ],
  },
  {
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: "call_abc123",
        content: "# README\n\nThis is a test file.",
      },
    ],
  },
  {
    role: "assistant",
    content: [{ type: "text", text: "The file contains a simple README with test content." }],
  },
];

export const readFileTool: AnthropicTool = {
  name: "read_file",
  description: "Read the contents of a file",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path to the file to read",
      },
    },
    required: ["path"],
  },
};

export const tools: AnthropicTool[] = [readFileTool];
