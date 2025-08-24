import { ExecutionLog, ApiCall } from "../types";

export interface LogAnalysis {
  totalRequests: number;
  totalResponseTime: number;
  averageResponseTime: number;
  successRate: number;
  errorsByType: Record<string, number>;
  providerUsage: Record<string, number>;
  toolUsagePattern: string[];
  conversationFlow: string[];
}

export class LogAnalyzer {
  static analyze(logs: ExecutionLog[]): LogAnalysis {
    const allCalls = logs.flatMap((log) => log.calls);

    const totalRequests = allCalls.length;
    const totalResponseTime = allCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

    const successfulLogs = logs.filter((log) => log.success).length;
    const successRate = logs.length > 0 ? successfulLogs / logs.length : 0;

    const errorsByType: Record<string, number> = {};
    const providerUsage: Record<string, number> = {};

    allCalls.forEach((call) => {
      // Count provider usage
      providerUsage[call.provider] = (providerUsage[call.provider] || 0) + 1;

      // Count error types
      if (call.error) {
        const errorType = this.categorizeError(call.error);
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
      }
    });

    const toolUsagePattern = this.extractToolUsage(allCalls);
    const conversationFlow = this.extractConversationFlow(logs);

    return {
      totalRequests,
      totalResponseTime,
      averageResponseTime,
      successRate,
      errorsByType,
      providerUsage,
      toolUsagePattern,
      conversationFlow,
    };
  }

  private static categorizeError(error: string): string {
    const lowerError = error.toLowerCase();

    if (lowerError.includes("timeout")) return "timeout";
    if (lowerError.includes("rate limit") || lowerError.includes("429")) return "rate_limit";
    if (lowerError.includes("unauthorized") || lowerError.includes("401")) return "auth";
    if (lowerError.includes("forbidden") || lowerError.includes("403")) return "forbidden";
    if (lowerError.includes("not found") || lowerError.includes("404")) return "not_found";
    if (lowerError.includes("network") || lowerError.includes("connection")) return "network";

    return "unknown";
  }

  private static extractToolUsage(calls: ApiCall[]): string[] {
    const toolPattern: string[] = [];

    calls.forEach((call) => {
      if (call.response && typeof call.response === "object") {
        const responseStr = JSON.stringify(call.response).toLowerCase();

        // Look for tool usage patterns
        if (responseStr.includes("tool_use") || responseStr.includes("tool_calls")) {
          toolPattern.push("tool_invocation");
        }
        if (responseStr.includes("read") && responseStr.includes("file")) {
          toolPattern.push("file_read");
        }
        if (responseStr.includes("write") && responseStr.includes("file")) {
          toolPattern.push("file_write");
        }
        if (responseStr.includes("bash") || responseStr.includes("command")) {
          toolPattern.push("command_execution");
        }
      }
    });

    return [...new Set(toolPattern)]; // Remove duplicates
  }

  private static extractConversationFlow(logs: ExecutionLog[]): string[] {
    return logs.map((log) => {
      const callCount = log.calls.length;
      const duration = log.endTime
        ? new Date(log.endTime).getTime() - new Date(log.startTime).getTime()
        : 0;

      return `${log.scenario}:${callCount}calls:${Math.round(duration / 1000)}s:${log.success ? "success" : "failed"}`;
    });
  }

  static generateReport(analysis: LogAnalysis): string {
    return `
# E2E Execution Analysis Report

## Summary
- Total Requests: ${analysis.totalRequests}
- Success Rate: ${(analysis.successRate * 100).toFixed(1)}%
- Average Response Time: ${analysis.averageResponseTime.toFixed(0)}ms
- Total Response Time: ${(analysis.totalResponseTime / 1000).toFixed(1)}s

## Provider Usage
${Object.entries(analysis.providerUsage)
  .map(([provider, count]) => `- ${provider}: ${count} requests`)
  .join("\n")}

## Error Analysis
${
  Object.keys(analysis.errorsByType).length === 0
    ? "- No errors detected"
    : Object.entries(analysis.errorsByType)
        .map(([type, count]) => `- ${type}: ${count} occurrences`)
        .join("\n")
}

## Tool Usage Patterns
${
  analysis.toolUsagePattern.length === 0
    ? "- No tool usage detected"
    : analysis.toolUsagePattern.map((tool) => `- ${tool}`).join("\n")
}

## Conversation Flow
${analysis.conversationFlow.map((flow) => `- ${flow}`).join("\n")}
`.trim();
  }

  static exportStructuredLogs(logs: ExecutionLog[]): {
    summary: LogAnalysis;
    rawLogs: ExecutionLog[];
    timestamp: string;
  } {
    return {
      summary: this.analyze(logs),
      rawLogs: logs,
      timestamp: new Date().toISOString(),
    };
  }
}
