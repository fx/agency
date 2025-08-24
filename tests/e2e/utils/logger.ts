import { ApiCall, ExecutionLog } from "../types";

export class E2ELogger {
  private logs: ExecutionLog[] = [];
  private currentSession: ExecutionLog | null = null;
  private verboseLogging = false;

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

  endSession(success: boolean, error?: string, finalResponse?: string): ExecutionLog | null {
    if (!this.currentSession) {
      return null;
    }

    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.success = success;
    if (error) {
      this.currentSession.error = error;
    }
    if (finalResponse) {
      this.currentSession.finalResponse = finalResponse;
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

  setVerboseLogging(verbose: boolean): void {
    this.verboseLogging = verbose;
  }

  exportLogs(): string {
    if (this.verboseLogging) {
      return JSON.stringify(this.logs, null, 2);
    }
    return this.formatHumanReadable();
  }

  private formatHumanReadable(): string {
    return this.logs.map(log => this.formatLogSummary(log)).join('\n');
  }

  private formatLogSummary(log: ExecutionLog): string {
    const duration = log.endTime 
      ? new Date(log.endTime).getTime() - new Date(log.startTime).getTime()
      : 0;
    
    const status = log.success ? '✅' : '❌';
    const calls = log.calls.length;
    const providers = [...new Set(log.calls.map(c => c.provider))].join(', ');
    
    let summary = `${status} ${log.scenario} (${duration}ms, ${calls} calls`;
    if (providers) {
      summary += `, ${providers}`;
    }
    summary += ')';
    
    if (log.error) {
      summary += ` - Error: ${log.error}`;
    } else if (log.finalResponse) {
      // Truncate long responses to keep summary readable
      const truncated = log.finalResponse.length > 100 
        ? log.finalResponse.substring(0, 100) + '...' 
        : log.finalResponse;
      summary += ` - Response: ${truncated}`;
    }
    
    return summary;
  }

  clear(): void {
    this.logs = [];
    this.currentSession = null;
  }
}

export const logger = new E2ELogger();
