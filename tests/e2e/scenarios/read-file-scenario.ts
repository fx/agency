import { BaseScenario } from "./base-scenario";
import { ScenarioConfig } from "../types";

const CLAUDE_CODE_SYSTEM_PROMPT = `You are Claude Code, Anthropic's official CLI for Claude.# Coder Agent

## Capabilities
- Implement features/bug fixes
- Work on GitHub issues
- Auto-select next issue if none provided
- Create PRs with proper workflow

## PR Strategy
1. **Feature branch**: \`feature/<issue>-<name>\` from main
2. **Sub-branches**: \`feature/<issue>-<name>-part-<n>\` for logical separation
3. **Keep PRs focused**: Logical, reviewable chunks

## Workflow
1. Get/select issue
2. Analyze requirements  
3. Plan logical PR structure if needed
4. Implement with tests
5. Create PR
6. Use pr-reviewer agent
7. Address feedback
8. Use pr-check-monitor for failing checks
9. Continue until ready for user review
10. Update issue to Done

## Multi-PR Coordination
- Work continuously, don't wait for approvals
- Create parallel PRs when independent
- Track all PRs in TodoWrite
- Shepherd each PR to completion

## Standards
- Follow CLAUDE.md rules
- Test bug fixes first
- Match code style
- Security best practices

Remember: Ship working code in small PRs. You own the entire lifecycle - implement, review, fix, and prepare for user approval.


Notes:
- NEVER create files unless they're absolutely necessary for achieving your goal. ALWAYS prefer editing an existing file to creating a new one.
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
- In your final response always share relevant file names and code snippets. Any file paths you return in your response MUST be absolute. Do NOT use relative paths.
- For clear communication with the user the assistant MUST avoid using emojis.

Here is useful information about the environment you are running in:
<env>
Working directory: /workspace
Is directory a git repo: Yes
Platform: linux
OS Version: Linux 6.12.35-talos
Today's date: 2025-08-23
</env>
You are powered by the model named Sonnet 4. The exact model ID is claude-sonnet-4-20250514.

Assistant knowledge cutoff is January 2025.

gitStatus: This is the git status at the start of the conversation. Note that this status is a snapshot in time, and will not update during the conversation.
Current branch: main

Main branch (you will usually use this for PRs): main

Status:
(clean)

Recent commits:
1be29db feat: initial commit from template

Answer the user's request using the relevant tool(s), if they are available. Check that all the required parameters for each tool call are provided or can reasonably be inferred from context. IF there are no relevant tools or there are missing values for required parameters, ask the user to supply these values; otherwise proceed with the tool calls. If the user provides a specific value for a parameter (for example provided in quotes), make sure to use that value EXACTLY. DO NOT make up values for or ask about optional parameters. Carefully analyze descriptive terms in the request as they may indicate required parameter values that should be included even if not explicitly quoted.`;

export class ReadFileScenario extends BaseScenario {
  constructor() {
    const config: ScenarioConfig = {
      name: "read-file",
      description: 'Test claude-code reading a test.txt file with "hello world" content',
      systemPrompt: CLAUDE_CODE_SYSTEM_PROMPT,
      initialMessage: "Read the file tests/e2e/test.txt and tell me its contents.",
      expectedBehavior: ["read", "test.txt", "hello world", "file_path"],
      timeout: 30000,
    };
    super(config);
  }

  protected async runScenario(provider: "anthropic" | "vercel"): Promise<{success: boolean, finalResponse?: string}> {
    const client = this.getClient(provider);

    // Define Read tool for claude-code emulation
    const tools = [
      {
        name: "Read",
        description: "Read a file from the local filesystem",
        input_schema: {
          type: "object",
          properties: {
            file_path: {
              type: "string", 
              description: "The absolute path to the file to read"
            }
          },
          required: ["file_path"]
        }
      }
    ];

    if (provider === "anthropic" && "sendMessage" in client) {
      return await this.runAnthropicFlow(client, tools);
    } else if (provider === "vercel" && "sendMessage" in client) {
      const vercelTools = [
        {
          type: "function",
          function: {
            name: "Read",
            description: "Read a file from the local filesystem", 
            parameters: {
              type: "object",
              properties: {
                file_path: {
                  type: "string",
                  description: "The absolute path to the file to read"
                }
              },
              required: ["file_path"]
            }
          }
        }
      ];

      return await this.runVercelFlow(client, vercelTools);
    }

    return { success: false };
  }

  private async runAnthropicFlow(client: any, tools: any[]): Promise<{success: boolean, finalResponse?: string}> {
    // Step 1: Initial request
    const initialResponse = await client.sendMessage(
      [{ role: "user", content: this.config.initialMessage }],
      this.config.systemPrompt,
      tools
    );

    // Check if AI wants to use tools
    const toolUses = this.extractToolUses(initialResponse.data, "anthropic");
    if (toolUses.length === 0) {
      const finalResponse = this.extractFinalResponse(initialResponse.data, "anthropic");
      return { success: false, finalResponse };
    }

    // Step 2: Execute tools and prepare tool results
    const messages = [
      { role: "user", content: this.config.initialMessage }
    ];

    // Add assistant's response with tool use
    const assistantContent = [];
    if (initialResponse.data.content) {
      for (const item of initialResponse.data.content) {
        assistantContent.push(item);
      }
    }
    messages.push({ role: "assistant", content: assistantContent });

    // Execute each tool and add results
    for (const toolUse of toolUses) {
      const toolResult = await this.executeToolCall(toolUse);
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: toolResult
          }
        ]
      });
    }

    // Step 3: Get final response from AI
    const finalResponse = await client.sendMessage(messages, this.config.systemPrompt, tools);
    
    const success = this.validateResponse(finalResponse.data, this.config.expectedBehavior);
    const finalResponseText = this.extractFinalResponse(finalResponse.data, "anthropic");
    
    return { success, finalResponse: finalResponseText };
  }

  private async runVercelFlow(client: any, vercelTools: any[]): Promise<{success: boolean, finalResponse?: string}> {
    // Step 1: Initial request
    const messages = [
      { role: "system" as const, content: this.config.systemPrompt },
      { role: "user" as const, content: this.config.initialMessage },
    ];

    const initialResponse = await client.sendMessage(messages, vercelTools);

    // Check if AI wants to use tools
    const toolCalls = this.extractToolCalls(initialResponse.data, "vercel");
    if (toolCalls.length === 0) {
      const finalResponse = this.extractFinalResponse(initialResponse.data, "vercel");
      return { success: false, finalResponse };
    }

    // Step 2: Add assistant message and tool results
    messages.push({
      role: "assistant",
      content: initialResponse.data.choices[0].message.content,
      tool_calls: initialResponse.data.choices[0].message.tool_calls
    });

    // Execute tools and add results
    for (const toolCall of toolCalls) {
      const toolResult = await this.executeToolCall({
        id: toolCall.id,
        name: toolCall.function.name,
        input: JSON.parse(toolCall.function.arguments)
      });
      
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResult
      });
    }

    // Step 3: Get final response
    const finalResponse = await client.sendMessage(messages, vercelTools);
    
    const success = this.validateResponse(finalResponse.data, this.config.expectedBehavior);
    const finalResponseText = this.extractFinalResponse(finalResponse.data, "vercel");
    
    return { success, finalResponse: finalResponseText };
  }

  private extractToolUses(response: any, provider: "anthropic"): Array<{id: string, name: string, input: any}> {
    if (!response?.content || !Array.isArray(response.content)) return [];
    
    return response.content
      .filter((item: any) => item.type === "tool_use")
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        input: item.input
      }));
  }

  private extractToolCalls(response: any, provider: "vercel"): Array<{id: string, function: {name: string, arguments: string}}> {
    if (!response?.choices?.[0]?.message?.tool_calls) return [];
    return response.choices[0].message.tool_calls;
  }

  private async executeToolCall(toolCall: {id: string, name: string, input: any}): Promise<string> {
    if (toolCall.name === "Read") {
      try {
        // Read the actual file
        const fs = await import('fs/promises');
        const content = await fs.readFile(toolCall.input.file_path, 'utf-8');
        return content;
      } catch (error) {
        return `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
    
    return `Tool ${toolCall.name} not implemented`;
  }

  private extractFinalResponse(response: unknown, provider: "anthropic" | "vercel"): string {
    if (!response || typeof response !== "object") {
      return "No response";
    }

    try {
      if (provider === "anthropic" && "content" in response && Array.isArray(response.content)) {
        // Extract text and tool_use from Anthropic response
        const textParts = response.content
          .filter((item: any) => item.type === "text")
          .map((item: any) => item.text);
        const toolParts = response.content
          .filter((item: any) => item.type === "tool_use")
          .map((item: any) => `Tool: ${item.name}(${JSON.stringify(item.input)})`);
        
        const allParts = [...textParts, ...toolParts];
        return allParts.length > 0 ? allParts.join(" | ") : "No content";
        
      } else if (provider === "vercel" && "choices" in response && Array.isArray(response.choices)) {
        // Extract from OpenAI/Vercel format
        const choice = response.choices[0];
        if (choice?.message) {
          const parts = [];
          if (choice.message.content) {
            parts.push(choice.message.content);
          }
          if (choice.message.tool_calls && Array.isArray(choice.message.tool_calls)) {
            choice.message.tool_calls.forEach((tool: any) => {
              parts.push(`Tool: ${tool.function.name}(${tool.function.arguments})`);
            });
          }
          return parts.length > 0 ? parts.join(" | ") : "No content";
        }
      }
    } catch (error) {
      return `Error extracting response: ${error}`;
    }

    return "Unknown response format";
  }

  protected validateResponse(response: unknown, expectations: string[]): boolean {
    if (!response || typeof response !== "object") {
      return false;
    }

    const responseStr = JSON.stringify(response).toLowerCase();

    // For the complete flow, we should see "hello world" in the final response
    // This indicates the AI successfully read and returned the file contents
    const hasFileContent = responseStr.includes("hello world");

    // Also check that it mentions the file or reading
    const hasReadReference = responseStr.includes("test.txt") || 
                            responseStr.includes("content") ||
                            responseStr.includes("file");

    return hasFileContent && hasReadReference;
  }
}
