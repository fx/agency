/**
 * Edge case tests for better coverage
 */

import { describe, test, expect } from "vitest";
import { fromOpenAI } from "../../src/providers/anthropic.js";
import { AgencyError } from "../../src/core/errors.js";

describe("edge cases", () => {
  test("handles empty tool calls gracefully", () => {
    const messages = [
      {
        role: "assistant" as const,
        content: "Hello",
        tool_calls: [],
      },
    ];

    const result = fromOpenAI(messages);
    expect(result).toHaveLength(1);
    expect(result[0]?.content).toHaveLength(1);
    expect(result[0]?.content[0]?.type).toBe("text");
  });

  test("handles message with only tool calls", () => {
    const messages = [
      {
        role: "assistant" as const,
        content: null,
        tool_calls: [
          {
            id: "call_123",
            type: "function" as const,
            function: {
              name: "test_tool",
              arguments: '{"param":"value"}',
            },
          },
        ],
      },
    ];

    const result = fromOpenAI(messages);
    expect(result).toHaveLength(1);
    expect(result[0]?.content).toHaveLength(1);
    expect(result[0]?.content[0]?.type).toBe("tool_use");
  });

  test("handles invalid JSON in tool arguments", () => {
    const messages = [
      {
        role: "assistant" as const,
        content: "Testing",
        tool_calls: [
          {
            id: "call_123",
            type: "function" as const,
            function: {
              name: "test_tool",
              arguments: "invalid json {",
            },
          },
        ],
      },
    ];

    expect(() => fromOpenAI(messages)).toThrow(AgencyError);
  });

  test("handles empty content message", () => {
    const messages = [
      {
        role: "user" as const,
        content: "",
      },
    ];

    expect(() => fromOpenAI(messages)).toThrow(AgencyError);
  });

  test("handles null content with no tool calls", () => {
    const messages = [
      {
        role: "assistant" as const,
        content: null,
      },
    ];

    expect(() => fromOpenAI(messages)).toThrow(AgencyError);
  });
});
