/**
 * Round-trip integration tests
 */

import { describe, test, expect } from "vitest";
import { anthropic, openai } from "../../src/index.js";
import * as openaiFixtures from "../fixtures/openai.js";
import * as anthropicFixtures from "../fixtures/anthropic.js";

describe("round-trip conversions", () => {
  test("OpenAI -> Anthropic -> OpenAI preserves structure", () => {
    const original = openaiFixtures.simpleTextMessage;
    const toAnthropic = openai.toAnthropic(original);
    const backToOpenai = anthropic.toOpenAI(toAnthropic);

    expect(backToOpenai).toHaveLength(original.length);
    expect(backToOpenai[0]?.role).toBe(original[0]?.role);
    expect(backToOpenai[0]?.content).toBe(original[0]?.content);
    expect(backToOpenai[1]?.role).toBe(original[1]?.role);
    expect(backToOpenai[1]?.content).toBe(original[1]?.content);
  });

  test("Anthropic -> OpenAI -> Anthropic preserves structure", () => {
    const original = anthropicFixtures.simpleTextMessage;
    const toOpenai = anthropic.toOpenAI(original);
    const backToAnthropic = openai.toAnthropic(toOpenai);

    expect(backToAnthropic).toHaveLength(original.length);
    expect(backToAnthropic[0]?.role).toBe(original[0]?.role);
    expect(backToAnthropic[0]?.content[0]?.text).toBe(original[0]?.content[0]?.text);
    expect(backToAnthropic[1]?.role).toBe(original[1]?.role);
    expect(backToAnthropic[1]?.content[0]?.text).toBe(original[1]?.content[0]?.text);
  });

  test("tool calls survive round-trip conversion", () => {
    const original = openaiFixtures.toolCallMessage;
    const toAnthropic = openai.toAnthropic(original);
    const backToOpenai = anthropic.toOpenAI(toAnthropic);

    expect(backToOpenai[1]?.tool_calls).toHaveLength(1);
    expect(backToOpenai[1]?.tool_calls?.[0]?.id).toBe("call_abc123");
    expect(backToOpenai[1]?.tool_calls?.[0]?.function.name).toBe("read_file");
    expect(backToOpenai[1]?.tool_calls?.[0]?.function.arguments).toBe('{"path":"README.md"}');
  });

  test("tools definition survive round-trip conversion", () => {
    const original = openaiFixtures.tools;
    const toAnthropic = openai.toolsToAnthropic(original);
    const backToOpenai = anthropic.toolsToOpenAI(toAnthropic);

    expect(backToOpenai).toHaveLength(original.length);
    expect(backToOpenai[0]?.function.name).toBe(original[0]?.function.name);
    expect(backToOpenai[0]?.function.description).toBe(original[0]?.function.description);
    expect(backToOpenai[0]?.function.parameters).toEqual(original[0]?.function.parameters);
  });
});
