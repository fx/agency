import { ApiCall, ExecutionLog } from "../types";

export class E2ELogger {
  private logs: ExecutionLog[] = [];
  private currentSession: ExecutionLog | null = null;

  startSession(sessionId: string, scenario: string): void {
    this.currentSession = {
      sessionId,
      scenario,
      startTime: new Date().toISOString(),
      calls: [],
      success: false,
    };
  }

  logApiCall(call: Omit<ApiCall, "timestamp">): void {
    if (!this.currentSession) {
      throw new Error("No active session");
    }

    const apiCall: ApiCall = {
      ...call,
      timestamp: new Date().toISOString(),
    };

    this.currentSession.calls.push(apiCall);
  }

  endSession(success: boolean, error?: string): ExecutionLog | null {
    if (!this.currentSession) {
      return null;
    }

    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.success = success;
    if (error) {
      this.currentSession.error = error;
    }

    this.logs.push(this.currentSession);
    const session = this.currentSession;
    this.currentSession = null;
    return session;
  }

  getLogs(): ExecutionLog[] {
    return [...this.logs];
  }

  getLatestSession(): ExecutionLog | null {
    return this.logs[this.logs.length - 1] || null;
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  clear(): void {
    this.logs = [];
    this.currentSession = null;
  }
}

export const logger = new E2ELogger();
