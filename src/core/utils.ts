/**
 * Utility functions for message translation
 */

import { createError } from "./errors.js";
import type { Provider } from "../types/index.js";

/**
 * Generate a unique ID for tool calls
 */
export function generateId(): string {
  return `call_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Safely parse JSON string
 */
export function safeJsonParse(str: string, provider: Provider): Record<string, unknown> {
  try {
    const parsed = JSON.parse(str);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw createError("validation", "Parsed JSON is not an object", provider, str);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw createError("validation", `Invalid JSON: ${error.message}`, provider, str);
    }
    throw error;
  }
}

/**
 * Safely stringify object to JSON
 */
export function safeJsonStringify(obj: unknown, provider: Provider): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    throw createError(
      "transform",
      `JSON stringify failed: ${(error as Error).message}`,
      provider,
      obj
    );
  }
}

/**
 * Check if value is non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Check if value is valid object (not null, not array)
 */
export function isValidObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
