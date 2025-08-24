import { BaseScenario } from "./base-scenario";
import { AnthropicClient } from "../clients/anthropic-client";
import { VercelClient } from "../clients/vercel-client";
import { ExecutionLog } from "../types";
import { logger } from "../utils/logger";

export interface RunnerConfig {
  anthropicApiKey?: string;
  vercelApiKey?: string;
  timeout?: number;
  concurrency?: number;
}

export class ScenarioRunner {
  private anthropicClient?: AnthropicClient;
  private vercelClient?: VercelClient;
  private config: RunnerConfig;

  constructor(config: RunnerConfig) {
    this.config = config;

    if (config.anthropicApiKey) {
      this.anthropicClient = new AnthropicClient({
        apiKey: config.anthropicApiKey,
        timeout: config.timeout,
      });
    }

    if (config.vercelApiKey) {
      this.vercelClient = new VercelClient({
        apiKey: config.vercelApiKey,
        timeout: config.timeout,
      });
    }
  }

  async runScenario(
    scenario: BaseScenario,
    provider: "anthropic" | "vercel" = "anthropic"
  ): Promise<ExecutionLog> {
    scenario.setClients(this.anthropicClient, this.vercelClient);

    const startTime = Date.now();
    try {
      const success = await scenario.execute(provider);
      const log = logger.getLatestSession();

      if (!log) {
        throw new Error("No execution log found");
      }

      return log;
    } catch (error) {
      const log = logger.getLatestSession();
      if (log) {
        return log;
      }

      // Fallback if no log was created
      return {
        sessionId: `error-${Date.now()}`,
        scenario: scenario.getConfig().name,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        calls: [],
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async runScenarios(
    scenarios: BaseScenario[],
    provider: "anthropic" | "vercel" = "anthropic"
  ): Promise<ExecutionLog[]> {
    const results: ExecutionLog[] = [];

    for (const scenario of scenarios) {
      const result = await this.runScenario(scenario, provider);
      results.push(result);
    }

    return results;
  }

  async runScenariosConcurrently(
    scenarios: BaseScenario[],
    provider: "anthropic" | "vercel" = "anthropic",
    maxConcurrency = this.config.concurrency || 3
  ): Promise<ExecutionLog[]> {
    const results: ExecutionLog[] = [];

    for (let i = 0; i < scenarios.length; i += maxConcurrency) {
      const batch = scenarios.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(
        batch.map((scenario) => this.runScenario(scenario, provider))
      );
      results.push(...batchResults);
    }

    return results;
  }

  getExecutionSummary(logs: ExecutionLog[]): {
    total: number;
    successful: number;
    failed: number;
    totalCalls: number;
    averageDuration: number;
  } {
    const totalDuration = logs.reduce((sum, log) => {
      if (!log.endTime) return sum;
      const duration = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();
      return sum + duration;
    }, 0);

    return {
      total: logs.length,
      successful: logs.filter((log) => log.success).length,
      failed: logs.filter((log) => !log.success).length,
      totalCalls: logs.reduce((sum, log) => sum + log.calls.length, 0),
      averageDuration: logs.length > 0 ? totalDuration / logs.length : 0,
    };
  }
}
