#!/usr/bin/env node

import { ScenarioRunner } from "./scenarios/scenario-runner";
import { ReadFileScenario } from "./scenarios/read-file-scenario";
import { LogAnalyzer } from "./utils/log-analyzer";
import { logger } from "./utils/logger";

// Demo with mock API responses to show framework functionality
async function runDemo() {
  console.log("🚀 E2E Agent Framework Demo\n");

  // Create mock scenario that doesn't require real API calls
  class MockReadFileScenario extends ReadFileScenario {
    protected async runScenario(provider: "anthropic" | "vercel"): Promise<boolean> {
      // Simulate API call logging
      logger.logApiCall({
        provider,
        method: "POST",
        url: `https://api.${provider}.com/v1/messages`,
        headers: {
          "Content-Type": "application/json",
          ...(provider === "anthropic"
            ? { "x-api-key": "sk-ant-***" }
            : { Authorization: "Bearer vck_***" }),
        },
        body: {
          model:
            provider === "anthropic"
              ? "claude-3-5-sonnet-20241022"
              : "anthropic:claude-3-5-sonnet-20241022",
          messages: [{ role: "user", content: this.config.initialMessage }],
          ...(provider === "anthropic" ? { system: this.config.systemPrompt } : {}),
        },
        response: {
          id: "msg_123",
          content: [
            {
              type: "tool_use",
              id: "toolu_01234567890",
              name: "Read",
              input: { file_path: "/workspace/test.txt" },
            },
          ],
          role: "assistant",
          stop_reason: "tool_use",
        },
        duration: 150 + Math.random() * 100,
      });

      // Mock successful response validation
      return true;
    }
  }

  const runner = new ScenarioRunner({
    // No real API keys needed for demo
    anthropicApiKey: "demo-key",
    vercelApiKey: "demo-key",
    timeout: 30000,
  });

  try {
    console.log("📋 Running single scenario...");
    const scenario = new MockReadFileScenario();
    const log = await runner.runScenario(scenario, "anthropic");

    console.log(`✅ Scenario '${log.scenario}' completed: ${log.success ? "SUCCESS" : "FAILED"}`);
    console.log(
      `⏱️  Duration: ${log.endTime ? new Date(log.endTime).getTime() - new Date(log.startTime).getTime() : 0}ms`
    );
    console.log(`🔗 API Calls: ${log.calls.length}`);

    console.log("\n📋 Running multiple scenarios...");
    const scenarios = [
      new MockReadFileScenario(),
      new MockReadFileScenario(),
      new MockReadFileScenario(),
    ];

    const logs = await runner.runScenarios(scenarios, "vercel");
    const summary = runner.getExecutionSummary(logs);

    console.log(`✅ Executed ${summary.total} scenarios`);
    console.log(`📊 Success rate: ${(summary.successRate * 100).toFixed(1)}%`);
    console.log(`🔗 Total API calls: ${summary.totalCalls}`);
    console.log(`⏱️  Average duration: ${Math.round(summary.averageDuration)}ms`);

    console.log("\n📈 Generating analysis report...");
    const analysis = LogAnalyzer.analyze(logs);
    const report = LogAnalyzer.generateReport(analysis);

    console.log(report);

    console.log("\n💾 Raw execution logs:");
    console.log("=====================================");
    const structuredExport = LogAnalyzer.exportStructuredLogs(logs);
    console.log(JSON.stringify(structuredExport.summary, null, 2));

    console.log("\n🎯 Framework capabilities demonstrated:");
    console.log("- ✅ Modular scenario system");
    console.log("- ✅ Multi-provider support (Anthropic + Vercel)");
    console.log("- ✅ Structured logging with API interaction tracking");
    console.log("- ✅ Execution analysis and reporting");
    console.log("- ✅ Concurrent scenario execution");
    console.log("- ✅ Error handling and timeout management");
  } catch (error) {
    console.error("❌ Demo failed:", error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}
