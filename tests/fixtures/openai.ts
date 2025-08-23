/**
 * OpenAI message format test fixtures
 */

import type { OpenAIMessage, OpenAITool } from "../../src/types/index.js";

export const simpleTextMessage: OpenAIMessage[] = [
  {
    role: "user",
    content: "Hello, how are you?",
  },
  {
    role: "assistant",
    content: "I'm doing well, thank you for asking!",
  },
];

export const toolCallMessage: OpenAIMessage[] = [
  {
    role: "user",
    content: "Read the file README.md",
  },
  {
    role: "assistant",
    content: "I'll read the README.md file for you.",
    tool_calls: [
      {
        id: "call_abc123",
        type: "function",
        function: {
          name: "read_file",
          arguments: '{"path":"README.md"}',
        },
      },
    ],
  },
];

export const toolResultMessage: OpenAIMessage[] = [
  {
    role: "user",
    content: "Read the file README.md",
  },
  {
    role: "assistant",
    content: "I'll read the README.md file for you.",
    tool_calls: [
      {
        id: "call_abc123",
        type: "function",
        function: {
          name: "read_file",
          arguments: '{"path":"README.md"}',
        },
      },
    ],
  },
  {
    role: "tool",
    tool_call_id: "call_abc123",
    content: "# README\\n\\nThis is a test file.",
  },
  {
    role: "assistant",
    content: "The file contains a simple README with test content.",
  },
];

export const systemMessage: OpenAIMessage[] = [
  {
    role: "system",
    content: "You are a helpful assistant.",
  },
  {
    role: "user",
    content: "Hello!",
  },
  {
    role: "assistant",
    content: "Hi there! How can I help you today?",
  },
];

export const readFileTool: OpenAITool = {
  type: "function",
  function: {
    name: "read_file",
    description: "Read the contents of a file",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to read",
        },
      },
      required: ["path"],
    },
  },
};

export const tools: OpenAITool[] = [readFileTool];
