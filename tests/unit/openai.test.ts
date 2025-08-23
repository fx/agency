/**
 * Tests for OpenAI message format handlers
 */

import { describe, test, expect } from "vitest";
import {
  fromAnthropic,
  toAnthropic,
  toolsFromAnthropic,
  toolsToAnthropic,
} from "../../src/providers/openai.js";
import * as openaiFixtures from "../fixtures/openai.js";
import * as anthropicFixtures from "../fixtures/anthropic.js";

describe("openai.fromAnthropic", () => {
  test("converts simple text messages", () => {
    const result = fromAnthropic(anthropicFixtures.simpleTextMessage);

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

  test("converts tool use messages", () => {
    const result = fromAnthropic(anthropicFixtures.toolCallMessage);

    expect(result).toHaveLength(2);
    expect(result[1]?.content).toBe("I'll read the README.md file for you.");
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
});

describe("openai.toAnthropic", () => {
  test("converts simple text messages", () => {
    const result = toAnthropic(openaiFixtures.simpleTextMessage);

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
    const result = toAnthropic(openaiFixtures.toolCallMessage);

    expect(result).toHaveLength(2);
    expect(result[1]?.content).toHaveLength(2);
    expect(result[1]?.content[1]).toEqual({
      type: "tool_use",
      id: "call_abc123",
      name: "read_file",
      input: { path: "README.md" },
    });
  });
});

describe("openai tools conversion", () => {
  test("converts Anthropic tools to OpenAI format", () => {
    const result = toolsFromAnthropic(anthropicFixtures.tools);

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

  test("converts OpenAI tools to Anthropic format", () => {
    const result = toolsToAnthropic(openaiFixtures.tools);

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
});
