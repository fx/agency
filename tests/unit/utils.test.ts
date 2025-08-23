/**
 * Tests for utility functions
 */

import { describe, test, expect } from "vitest";
import {
  generateId,
  safeJsonParse,
  safeJsonStringify,
  isNonEmptyString,
  isValidObject,
} from "../../src/core/utils.js";
import { AgencyError } from "../../src/core/errors.js";

describe("generateId", () => {
  test("generates unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();

    expect(id1).toMatch(/^call_[a-z0-9]+$/);
    expect(id2).toMatch(/^call_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });
});

describe("safeJsonParse", () => {
  test("parses valid JSON object", () => {
    const result = safeJsonParse('{"key":"value"}', "openai");
    expect(result).toEqual({ key: "value" });
  });

  test("throws error for invalid JSON", () => {
    expect(() => safeJsonParse("invalid json", "openai")).toThrow(AgencyError);
  });

  test("throws error for non-object JSON", () => {
    expect(() => safeJsonParse('"string"', "openai")).toThrow(AgencyError);
    expect(() => safeJsonParse("123", "openai")).toThrow(AgencyError);
    expect(() => safeJsonParse("[]", "openai")).toThrow(AgencyError);
  });
});

describe("safeJsonStringify", () => {
  test("stringifies valid object", () => {
    const result = safeJsonStringify({ key: "value" }, "anthropic");
    expect(result).toBe('{"key":"value"}');
  });

  test("handles circular references gracefully", () => {
    const obj = { key: "value" } as any;
    obj.self = obj;

    expect(() => safeJsonStringify(obj, "anthropic")).toThrow(AgencyError);
  });
});

describe("isNonEmptyString", () => {
  test("returns true for non-empty strings", () => {
    expect(isNonEmptyString("hello")).toBe(true);
    expect(isNonEmptyString(" ")).toBe(true);
  });

  test("returns false for empty string and non-strings", () => {
    expect(isNonEmptyString("")).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(123)).toBe(false);
  });
});

describe("isValidObject", () => {
  test("returns true for valid objects", () => {
    expect(isValidObject({})).toBe(true);
    expect(isValidObject({ key: "value" })).toBe(true);
  });

  test("returns false for non-objects", () => {
    expect(isValidObject(null)).toBe(false);
    expect(isValidObject([])).toBe(false);
    expect(isValidObject("string")).toBe(false);
    expect(isValidObject(123)).toBe(false);
    expect(isValidObject(undefined)).toBe(false);
  });
});
