/**
 * Tests for Anthropic message format handlers
 */

import { describe, test, expect } from "vitest";
import {
  fromOpenAI,
  toOpenAI,
  toolsFromOpenAI,
  toolsToOpenAI,
} from "../../src/providers/anthropic.js";
import { AgencyError } from "../../src/core/errors.js";
import * as openaiFixtures from "../fixtures/openai.js";
import * as anthropicFixtures from "../fixtures/anthropic.js";

describe("anthropic.fromOpenAI", () => {
  test("converts simple text messages", () => {
    const result = fromOpenAI(openaiFixtures.simpleTextMessage);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      role: "user",
      content: [{ type: "text", text: "Hello, how are you?" }],
    });
    expect(result[1]).toEqual({
      role: "assistant",
      content: [{ type: "text", text: "I'm doing well, thank you for asking!" }],
    });
  });

  test("converts tool call messages", () => {
    const result = fromOpenAI(openaiFixtures.toolCallMessage);

    expect(result).toHaveLength(2);
    expect(result[1]?.content).toHaveLength(2);
    expect(result[1]?.content[0]).toEqual({
      type: "text",
      text: "I'll read the README.md file for you.",
    });
    expect(result[1]?.content[1]).toEqual({
      type: "tool_use",
      id: "call_abc123",
      name: "read_file",
      input: { path: "README.md" },
    });
  });

  test("handles system messages by extracting them", () => {
    const result = fromOpenAI(openaiFixtures.systemMessage);

    expect(result).toHaveLength(2);
    expect(result[0]?.role).toBe("user");
    expect(result[1]?.role).toBe("assistant");
  });

  test("throws error for tool result without assistant message", () => {
    const invalidMessages = [
      {
        role: "tool" as const,
        tool_call_id: "call_123",
        content: "result",
      },
    ];

    expect(() => fromOpenAI(invalidMessages)).toThrow(AgencyError);
  });
});

describe("anthropic.toOpenAI", () => {
  test("converts simple text messages", () => {
    const result = toOpenAI(anthropicFixtures.simpleTextMessage);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      role: "user",
      content: "Hello, how are you?",
    });
    expect(result[1]).toEqual({
      role: "assistant",
      content: "I'm doing well, thank you for asking!",
    });
  });

  test("converts tool use to tool calls", () => {
    const result = toOpenAI(anthropicFixtures.toolCallMessage);

    expect(result).toHaveLength(2);
    expect(result[1]?.tool_calls).toHaveLength(1);
    expect(result[1]?.tool_calls?.[0]).toEqual({
      id: "call_abc123",
      type: "function",
      function: {
        name: "read_file",
        arguments: '{"path":"README.md"}',
      },
    });
  });

  test("converts tool results to separate messages", () => {
    const result = toOpenAI(anthropicFixtures.toolResultMessage);

    expect(result).toHaveLength(4);
    expect(result[2]).toEqual({
      role: "tool",
      tool_call_id: "call_abc123",
      content: "# README\n\nThis is a test file.",
    });
  });
});

describe("anthropic tools conversion", () => {
  test("converts OpenAI tools to Anthropic format", () => {
    const result = toolsFromOpenAI(openaiFixtures.tools);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
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
    });
  });

  test("converts Anthropic tools to OpenAI format", () => {
    const result = toolsToOpenAI(anthropicFixtures.tools);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
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
    });
  });
});
