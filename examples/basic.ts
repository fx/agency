/**
 * Basic usage examples for Agency
 */

import { agency } from "../src/index.js";
import type { OpenAIMessage, AnthropicMessage } from "../src/types/index.js";

// Example OpenAI messages with tool calling
const openaiMessages: OpenAIMessage[] = [
  {
    role: "user",
    content: "Please read the README.md file and summarize it",
  },
  {
    role: "assistant",
    content: "I'll read the README file for you.",
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
    content: "# Agency\n\nLLM message translator between providers",
  },
  {
    role: "assistant",
    content: "The README describes Agency as an LLM message translator between providers.",
  },
];

// Convert OpenAI to Anthropic format
const anthropicMessages = agency.openai.toAnthropic(openaiMessages);
console.log("Converted to Anthropic format:");
console.log(JSON.stringify(anthropicMessages, null, 2));

// Convert back to OpenAI format
const backToOpenai = agency.anthropic.toOpenAI(anthropicMessages);
console.log("\nConverted back to OpenAI format:");
console.log(JSON.stringify(backToOpenai, null, 2));

// Tool definitions example
const openaiTools = [
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description: "Read a file from the filesystem",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path to read" },
        },
        required: ["path"],
      },
    },
  },
];

const anthropicTools = agency.openai.toolsToAnthropic(openaiTools);
console.log("\nTools in Anthropic format:");
console.log(JSON.stringify(anthropicTools, null, 2));
