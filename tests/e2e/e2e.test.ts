import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { config } from "dotenv";
import { ScenarioRunner } from "./scenarios/scenario-runner";
import { ReadFileScenario } from "./scenarios/read-file-scenario";
import { logger } from "./utils/logger";

// Load environment variables from .env.local
config({ path: ".env.local" });

// API Keys from environment variables (required for E2E tests)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const VERCEL_API_KEY = process.env.VERCEL_API_KEY;

describe("E2E Agent Execution Chains", () => {
  let runner: ScenarioRunner;

  beforeEach(() => {
    // Skip E2E tests if API keys are not configured
    if (!ANTHROPIC_API_KEY || !VERCEL_API_KEY) {
      throw new Error(
        "API keys required for E2E tests. Please configure ANTHROPIC_API_KEY and VERCEL_API_KEY in .env.local"
      );
    }

    logger.clear();
    runner = new ScenarioRunner({
      anthropicApiKey: ANTHROPIC_API_KEY,
      vercelApiKey: VERCEL_API_KEY,
      timeout: 30000,
    });
  });

  afterEach(() => {
    // Log execution results for debugging
    const logs = logger.getLogs();
    if (logs.length > 0) {
      console.log("\\nExecution Logs:");
      console.log(logger.exportLogs());
    }
  });

  describe("ReadFile Scenario", () => {
    it("should successfully read test.txt file through tool calls", async () => {
      const scenario = new ReadFileScenario();

      const log = await runner.runScenario(scenario, "anthropic");

      // The scenario should succeed - Claude should use Read tool and return file contents
      expect(log.success).toBe(true);
      expect(log.calls.length).toBeGreaterThan(0);

      // Verify Claude attempted to use a Read tool
      const response = log.calls[log.calls.length - 1].response;
      expect(response).toMatchObject({
        content: expect.arrayContaining([
          expect.objectContaining({
            type: "tool_use", 
            name: expect.stringMatching(/read/i)
          })
        ])
      });
    }, 45000);

    it("should successfully read test.txt file through Vercel AI Gateway", async () => {
      const scenario = new ReadFileScenario();
      
      const log = await runner.runScenario(scenario, "vercel");
      
      // Should succeed and make tool calls through OpenAI-compatible format
      expect(log.success).toBe(true);
      expect(log.calls.length).toBeGreaterThan(0);
      
      // Verify tool calling through Vercel Gateway (OpenAI format)
      const response = log.calls[log.calls.length - 1].response;
      expect(response).toMatchObject({
        choices: expect.arrayContaining([
          expect.objectContaining({
            message: expect.objectContaining({
              tool_calls: expect.arrayContaining([
                expect.objectContaining({
                  function: expect.objectContaining({
                    name: expect.stringMatching(/read/i)
                  })
                })
              ])
            })
          })
        ])
      });
    }, 45000);

    it("should complete initial tool request with structured logging", async () => {
      const scenario = new ReadFileScenario();

      const log = await runner.runScenario(scenario, "anthropic");

      // Should successfully request the Read tool
      expect(log.success).toBe(true);
      expect(log.calls.length).toBe(1); // Currently only makes initial request

      // Verify logging structure  
      expect(log.sessionId).toMatch(/read-file-\d+/);
      expect(log.startTime).toBeDefined();
      expect(log.endTime).toBeDefined();

      // First call should request tool use
      const call = log.calls[0];
      expect(call.provider).toBe("anthropic");
      expect(call.url).toBe("https://api.anthropic.com/v1/messages");
      expect(call.headers["x-api-key"]).toMatch(/^sk-ant-a\.\.\./);

      // Response should contain tool_use request
      expect(call.response).toMatchObject({
        content: expect.arrayContaining([
          expect.objectContaining({
            type: "tool_use",
            name: "Read",
            input: { file_path: "/workspace/tests/e2e/test.txt" }
          })
        ])
      });
    });

    it("should handle API errors gracefully", async () => {
      // Use a truly invalid API key that will cause authentication failure  
      const invalidRunner = new ScenarioRunner({
        anthropicApiKey: "sk-ant-invalid-key-12345",
        timeout: 5000,
      });

      const scenario = new ReadFileScenario();

      const log = await invalidRunner.runScenario(scenario, "anthropic");

      expect(log.success).toBe(false);
      expect(log.calls.length).toBeGreaterThan(0); // At least one call should be made
      // Error should be logged in at least one call object
      const hasError = log.calls.some(call => call.error && typeof call.error === "string");
      expect(hasError).toBe(true);
    });
  });

  describe("Scenario Runner", () => {
    it("should provide execution summary", async () => {
      const scenarios = [new ReadFileScenario(), new ReadFileScenario()];

      const logs = await runner.runScenarios(scenarios, "anthropic");
      const summary = runner.getExecutionSummary(logs);

      expect(summary.total).toBe(2);
      expect(summary.totalCalls).toBeGreaterThan(0);
      expect(summary.averageDuration).toBeTypeOf("number");
    });

    it("should support concurrent scenario execution", async () => {
      const scenarios = [new ReadFileScenario(), new ReadFileScenario(), new ReadFileScenario()];

      const startTime = Date.now();
      const logs = await runner.runScenariosConcurrently(scenarios, "anthropic", 2);
      const duration = Date.now() - startTime;

      expect(logs).toHaveLength(3);
      // Concurrent execution should be faster than sequential
      // This is a rough check - in practice, network calls dominate timing
      expect(duration).toBeLessThan(90000); // Less than 1.5 minutes for 3 scenarios
    }, 120000);
  });
});
