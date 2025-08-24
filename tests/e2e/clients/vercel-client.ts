import { ApiResponse, ClientOptions } from "../types";
import { logger } from "../utils/logger";

interface VercelMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface VercelRequest {
  model: string;
  messages: VercelMessage[];
  max_tokens?: number;
  temperature?: number;
  tools?: unknown[];
  tool_choice?: unknown;
}

interface VercelResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string;
      tool_calls?: unknown[];
    };
    finish_reason: "stop" | "length" | "tool_calls" | "content_filter";
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface VercelErrorResponse {
  error: {
    message?: string;
    type?: string;
    code?: string;
  } | string;
}

export class VercelClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private logging: boolean;

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || "https://ai-gateway.vercel.sh/v1";
    this.timeout = options.timeout || 30000;
    this.logging = options.logging ?? true;
  }

  async sendMessage(
    messages: VercelMessage[],
    tools?: unknown[]
  ): Promise<ApiResponse<VercelResponse>> {
    const startTime = Date.now();
    const url = `${this.baseUrl}/chat/completions`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    const body: VercelRequest = {
      model: "anthropic/claude-3-5-sonnet-20241022",
      messages,
      max_tokens: 8192,
      ...(tools && { tools }),
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeout),
      });

      const responseData = (await response.json()) as VercelResponse | VercelErrorResponse;
      const duration = Date.now() - startTime;

      // Check if response contains an error (even with 2xx status)
      if ("error" in responseData) {
        const errorObj = responseData.error;
        let errorMessage: string;
        if (typeof errorObj === "object" && errorObj !== null && "message" in errorObj && typeof errorObj.message === "string") {
          errorMessage = errorObj.message;
        } else if (typeof errorObj === "string") {
          errorMessage = errorObj;
        } else {
          errorMessage = "API Error";
        }
        
        if (this.logging) {
          logger.logApiCall({
            provider: "vercel",
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

      // Check for non-2xx status codes
      if (!response.ok) {
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (this.logging) {
          logger.logApiCall({
            provider: "vercel",
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
          provider: "vercel",
          method: "POST",
          url,
          headers: this.sanitizeHeaders(headers),
          body,
          response: responseData,
          duration,
        });
      }

      return {
        data: responseData as VercelResponse,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      if (this.logging) {
        logger.logApiCall({
          provider: "vercel",
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
    if (sanitized.Authorization) {
      sanitized.Authorization = `Bearer ${sanitized.Authorization.slice(7, 15)}...`;
    }
    return sanitized;
  }
}
