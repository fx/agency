/**
 * Error handling for message translation
 */

import type { Provider, TranslationError } from "../types/index.js";

export class AgencyError extends Error {
  constructor(
    message: string,
    public readonly provider: Provider,
    public readonly originalData: unknown
  ) {
    super(message);
    this.name = "AgencyError";
  }
}

export class ValidationError extends AgencyError {
  constructor(message: string, provider: Provider, originalData: unknown) {
    super(`Validation failed: ${message}`, provider, originalData);
    this.name = "ValidationError";
  }
}

export class TransformError extends AgencyError {
  constructor(message: string, provider: Provider, originalData: unknown) {
    super(`Transform failed: ${message}`, provider, originalData);
    this.name = "TransformError";
  }
}

export function createError(
  type: "validation" | "transform",
  message: string,
  provider: Provider,
  data: unknown
): AgencyError {
  return type === "validation"
    ? new ValidationError(message, provider, data)
    : new TransformError(message, provider, data);
}
