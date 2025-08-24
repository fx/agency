import { ScenarioConfig } from "../types";
import { AnthropicClient } from "../clients/anthropic-client";
import { VercelClient } from "../clients/vercel-client";
import { logger } from "../utils/logger";

export abstract class BaseScenario {
  protected config: ScenarioConfig;
  protected anthropicClient?: AnthropicClient;
  protected vercelClient?: VercelClient;

  constructor(config: ScenarioConfig) {
    this.config = config;
  }

  setClients(anthropicClient?: AnthropicClient, vercelClient?: VercelClient): void {
    this.anthropicClient = anthropicClient;
    this.vercelClient = vercelClient;
  }

  async execute(provider: "anthropic" | "vercel" = "anthropic"): Promise<boolean> {
    const sessionId = `${this.config.name}-${Date.now()}`;
    logger.startSession(sessionId, this.config.name);

    try {
      const { success, finalResponse } = await this.runScenario(provider);
      logger.endSession(success, undefined, finalResponse);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.endSession(false, errorMessage);
      throw error;
    }
  }

  protected abstract runScenario(provider: "anthropic" | "vercel"): Promise<{success: boolean, finalResponse?: string}>;

  protected getClient(provider: "anthropic" | "vercel") {
    if (provider === "anthropic") {
      if (!this.anthropicClient) {
        throw new Error("Anthropic client not configured");
      }
      return this.anthropicClient;
    } else {
      if (!this.vercelClient) {
        throw new Error("Vercel client not configured");
      }
      return this.vercelClient;
    }
  }

  protected validateResponse(response: unknown, expectations: string[]): boolean {
    // Default validation - can be overridden by specific scenarios
    if (!response) return false;

    // Basic validation that response contains expected patterns
    const responseStr = JSON.stringify(response).toLowerCase();
    return expectations.every((expectation) => responseStr.includes(expectation.toLowerCase()));
  }

  getConfig(): ScenarioConfig {
    return { ...this.config };
  }
}
