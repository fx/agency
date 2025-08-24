export interface ApiCall {
  timestamp: string;
  provider: "anthropic" | "vercel";
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  response?: unknown;
  error?: string;
  duration?: number;
}

export interface ExecutionLog {
  sessionId: string;
  scenario: string;
  startTime: string;
  endTime?: string;
  calls: ApiCall[];
  success: boolean;
  error?: string;
}

export interface ScenarioConfig {
  name: string;
  description: string;
  systemPrompt: string;
  initialMessage: string;
  expectedBehavior: string[];
  timeout?: number;
}

export interface ClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  logging?: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}
