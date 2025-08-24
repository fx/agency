import { ApiResponse, ClientOptions } from "../types";
import { logger } from "../utils/logger";

interface AnthropicMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  system?: string;
  messages: AnthropicMessage[];
  tools?: unknown[];
  tool_choice?: unknown;
}

interface AnthropicResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<
    { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: unknown }
  >;
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use";
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AnthropicErrorResponse {
  type: "error";
  error: {
    message?: string;
    type?: string;
  };
}

export class AnthropicClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private logging: boolean;

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || "https://api.anthropic.com";
    this.timeout = options.timeout || 30000;
    this.logging = options.logging ?? true;
  }

  async sendMessage(
    messages: AnthropicMessage[],
    systemPrompt?: string,
    tools?: unknown[]
  ): Promise<ApiResponse<AnthropicResponse>> {
    const startTime = Date.now();
    const url = `${this.baseUrl}/v1/messages`;

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
    };

    const body: AnthropicRequest = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8192,
      messages,
      ...(systemPrompt && { system: systemPrompt }),
      ...(tools && { tools }),
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeout),
      });

      const responseData = (await response.json()) as AnthropicResponse | AnthropicErrorResponse;
      const duration = Date.now() - startTime;

      // Check if response contains an error (even with 200 status)
      if ("type" in responseData && responseData.type === "error") {
        const errorMessage = responseData.error.message || "API Error";
        
        if (this.logging) {
          logger.logApiCall({
            provider: "anthropic",
            method: "POST",
            url,
            headers: this.sanitizeHeaders(headers),
            body,
            response: responseData,
            error: errorMessage,
            duration,
          });
        }

        throw new Error(errorMessage);
      }

      if (this.logging) {
        logger.logApiCall({
          provider: "anthropic",
          method: "POST",
          url,
          headers: this.sanitizeHeaders(headers),
          body,
          response: responseData,
          duration,
        });
      }

      return {
        data: responseData as AnthropicResponse,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      if (this.logging) {
        logger.logApiCall({
          provider: "anthropic",
          method: "POST",
          url,
          headers: this.sanitizeHeaders(headers),
          body,
          error: error instanceof Error ? error.message : String(error),
          duration,
        });
      }

      throw error;
    }
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    if (sanitized["x-api-key"]) {
      sanitized["x-api-key"] = `${sanitized["x-api-key"].slice(0, 8)}...`;
    }
    return sanitized;
  }
}
