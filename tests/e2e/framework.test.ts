import { describe, it, expect, beforeEach } from "vitest";
import { ScenarioRunner } from "./scenarios/scenario-runner";
import { BaseScenario } from "./scenarios/base-scenario";
import { logger } from "./utils/logger";
import { LogAnalyzer } from "./utils/log-analyzer";
import type { ScenarioConfig } from "./types";

// Mock scenario for testing framework without API calls
class MockScenario extends BaseScenario {
  private shouldSucceed: boolean;

  constructor(name: string, shouldSucceed = true) {
    const config: ScenarioConfig = {
      name,
      description: `Mock scenario: ${name}`,
      systemPrompt: "Test system prompt",
      initialMessage: "Test message",
      expectedBehavior: ["test", "success"],
      timeout: 1000,
    };
    super(config);
    this.shouldSucceed = shouldSucceed;
  }

  protected async runScenario(provider: "anthropic" | "vercel"): Promise<boolean> {
    // Add small delay to simulate API call
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Simulate API call logging
    logger.logApiCall({
      provider,
      method: "POST",
      url: `https://api.${provider}.com/test`,
      headers: { "Content-Type": "application/json" },
      body: { test: true },
      response: this.shouldSucceed ? { success: true } : undefined,
      error: this.shouldSucceed ? undefined : "Mock error",
      duration: 100 + Math.random() * 50,
    });

    return this.shouldSucceed;
  }
}

describe("E2E Framework Core", () => {
  beforeEach(() => {
    logger.clear();
  });

  describe("ScenarioRunner", () => {
    it("should initialize without API keys", () => {
      const runner = new ScenarioRunner({
        timeout: 5000,
      });

      expect(runner).toBeDefined();
    });

    it("should run a successful scenario", async () => {
      const runner = new ScenarioRunner({});
      const scenario = new MockScenario("test-success");

      const log = await runner.runScenario(scenario, "anthropic");

      expect(log.scenario).toBe("test-success");
      expect(log.success).toBe(true);
      expect(log.calls).toHaveLength(1);
      expect(log.calls[0].provider).toBe("anthropic");
    });

    it("should run a failing scenario", async () => {
      const runner = new ScenarioRunner({});
      const scenario = new MockScenario("test-failure", false);

      const log = await runner.runScenario(scenario, "vercel");

      expect(log.scenario).toBe("test-failure");
      expect(log.success).toBe(false);
      expect(log.calls).toHaveLength(1);
      expect(log.calls[0].error).toBeDefined();
    });

    it("should run multiple scenarios", async () => {
      const runner = new ScenarioRunner({});
      const scenarios = [
        new MockScenario("test-1"),
        new MockScenario("test-2"),
        new MockScenario("test-3", false),
      ];

      const logs = await runner.runScenarios(scenarios, "anthropic");

      expect(logs).toHaveLength(3);
      expect(logs[0].success).toBe(true);
      expect(logs[1].success).toBe(true);
      expect(logs[2].success).toBe(false);
    });

    it("should provide execution summary", async () => {
      const runner = new ScenarioRunner({});
      const scenarios = [new MockScenario("test-1"), new MockScenario("test-2", false)];

      const logs = await runner.runScenarios(scenarios, "anthropic");
      const summary = runner.getExecutionSummary(logs);

      expect(summary.total).toBe(2);
      expect(summary.successful).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.totalCalls).toBe(2);
      expect(summary.averageDuration).toBeGreaterThan(0);
    });
  });

  describe("Logger", () => {
    it("should track session lifecycle", () => {
      logger.startSession("test-session", "test-scenario");

      logger.logApiCall({
        provider: "anthropic",
        method: "POST",
        url: "https://test.com",
        headers: {},
        duration: 100,
      });

      const session = logger.endSession(true);

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe("test-session");
      expect(session?.scenario).toBe("test-scenario");
      expect(session?.success).toBe(true);
      expect(session?.calls).toHaveLength(1);
    });

    it("should handle multiple sessions", () => {
      // First session
      logger.startSession("session-1", "scenario-1");
      logger.logApiCall({
        provider: "anthropic",
        method: "POST",
        url: "https://test.com",
        headers: {},
      });
      logger.endSession(true);

      // Second session
      logger.startSession("session-2", "scenario-2");
      logger.logApiCall({
        provider: "vercel",
        method: "POST",
        url: "https://test.com",
        headers: {},
      });
      logger.endSession(false, "Test error");

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].success).toBe(true);
      expect(logs[1].success).toBe(false);
      expect(logs[1].error).toBe("Test error");
    });
  });

  describe("LogAnalyzer", () => {
    it("should analyze execution logs", async () => {
      const runner = new ScenarioRunner({});
      const scenarios = [new MockScenario("analysis-1"), new MockScenario("analysis-2", false)];

      const logs = await runner.runScenarios(scenarios, "anthropic");
      const analysis = LogAnalyzer.analyze(logs);

      expect(analysis.totalRequests).toBe(2);
      expect(analysis.successRate).toBe(0.5);
      expect(analysis.providerUsage.anthropic).toBe(2);
      expect(analysis.errorsByType.unknown).toBe(1);
      expect(analysis.conversationFlow).toHaveLength(2);
    });

    it("should generate analysis report", async () => {
      const runner = new ScenarioRunner({});
      const scenarios = [new MockScenario("report-test")];

      const logs = await runner.runScenarios(scenarios, "vercel");
      const analysis = LogAnalyzer.analyze(logs);
      const report = LogAnalyzer.generateReport(analysis);

      expect(report).toContain("E2E Execution Analysis Report");
      expect(report).toContain("Total Requests: 1");
      expect(report).toContain("Success Rate: 100.0%");
      expect(report).toContain("vercel: 1 requests");
    });

    it("should export structured logs", async () => {
      const runner = new ScenarioRunner({});
      const logs = await runner.runScenarios([new MockScenario("export-test")], "anthropic");

      const export_ = LogAnalyzer.exportStructuredLogs(logs);

      expect(export_.summary).toBeDefined();
      expect(export_.rawLogs).toEqual(logs);
      expect(export_.timestamp).toBeDefined();
      expect(new Date(export_.timestamp)).toBeInstanceOf(Date);
    });
  });
});
