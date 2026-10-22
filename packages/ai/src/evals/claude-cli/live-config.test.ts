import { describe, expect, it } from "vitest";

import { getDefaultModel } from "../../providers/provider-models";
import { OFFICIAL_CASSETTE_MODEL } from "../cassettes/validate-cassette";
import {
  NOT_MEASURED_PREFIX,
  DEFAULT_CALL_TIMEOUT_MS,
  readCallTimeoutMs,
  readMaxCalls,
  readMaxWeekly,
  readModelId,
} from "./live-config";

const THREE = 3;
const DEFAULT_WEEKLY = 0.85;
const HALF = 0.5;

describe("live-config", () => {
  it("should read the call timeout, defaulting and rejecting a non-integer", () => {
    // Arrange
    const custom = { EVAL_CALL_TIMEOUT_MS: "1000" };
    const bad = { EVAL_CALL_TIMEOUT_MS: "soon" };

    // Act
    const values = [readCallTimeoutMs({}), readCallTimeoutMs(custom)];

    // Assert
    expect(values).toEqual([
      DEFAULT_CALL_TIMEOUT_MS,
      Number(custom.EVAL_CALL_TIMEOUT_MS),
    ]);
    expect(() => readCallTimeoutMs(bad)).toThrow("EVAL_CALL_TIMEOUT_MS");
  });

  it("should default EVAL_MODEL to the literal, never to the catalog default", () => {
    // Arrange
    const env = {};

    // Act
    const modelId = readModelId(env);

    // Assert
    expect(modelId).toBe(OFFICIAL_CASSETTE_MODEL);
    expect(typeof getDefaultModel("anthropic")).toBe("string");
  });

  it("should accept another Anthropic id as an iteration model", () => {
    // Arrange
    const env = { EVAL_MODEL: "claude-haiku-4-5" };

    // Act
    const modelId = readModelId(env);

    // Assert
    expect(modelId).toBe("claude-haiku-4-5");
  });

  it("should report an OpenAI or Google id as not measured", () => {
    // Arrange
    const ids = ["gpt-5", "gemini-2.5-pro"];

    // Act
    const messages = ids.map((id) => {
      try {
        return readModelId({ EVAL_MODEL: id });
      } catch (error) {
        return (error as Error).message;
      }
    });

    // Assert
    for (const message of messages) {
      expect(message.startsWith(`${NOT_MEASURED_PREFIX}:`)).toBe(true);
    }
  });

  it("should read the call budget and refuse a value that is not a positive integer", () => {
    // Arrange
    const bad = ["0", "-1", "2.5", "many"];

    // Act
    const three = readMaxCalls({ EVAL_MAX_CALLS: "3" });

    // Assert
    expect(three).toBe(THREE);
    for (const raw of bad) {
      expect(() => readMaxCalls({ EVAL_MAX_CALLS: raw })).toThrow(
        "EVAL_MAX_CALLS must be a positive integer"
      );
    }
  });

  it("should read the weekly limit as a fraction in (0, 1]", () => {
    // Arrange
    const bad = ["0", "85", "-0.1", "x"];

    // Act
    const fallback = readMaxWeekly({});
    const set = readMaxWeekly({ EVAL_MAX_WEEKLY_UTILIZATION: "0.5" });

    // Assert
    expect(fallback).toBe(DEFAULT_WEEKLY);
    expect(set).toBe(HALF);
    for (const raw of bad) {
      expect(() => readMaxWeekly({ EVAL_MAX_WEEKLY_UTILIZATION: raw })).toThrow(
        "a fraction in (0, 1]"
      );
    }
  });
});
