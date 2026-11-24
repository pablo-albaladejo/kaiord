import { describe, expect, it } from "vitest";

import { priceRun } from "./price-run";

const AT = new Date("2026-11-23T10:00:00Z");
const DIGITS = 10;
// Worked by hand from the official per-1M prices, never from the code.
const SONNET_5_CACHED_USD = 0.00669;
const HAIKU_4_5_ONE_MTOK_EACH_USD = 6;
const GPT_5_MINI_ONE_MTOK_EACH_USD = 2.25;
const SONNET_5_ATTEMPT_USD = 0.007;
const TWO_SONNET_5_ATTEMPTS_USD = 0.014;
const GPT_6_1_SOL_LONG_USD = 1.215;
const ARGON_ONE_MTOK_BEFORE_USD = 2;
const ARGON_ONE_MTOK_AFTER_USD = 4;

describe("priceRun", () => {
  it("should price input, output and cache tokens at the model's own prices", () => {
    // Arrange
    // Claude-sonnet-5 is $2 in, $10 out, $0.20 cache read and $2.50
    // cache write per 1M; 700 uncached + 200 read + 100 written = 1000 input.
    const requests = [
      {
        outcome: "ok" as const,
        usage: {
          promptTokens: 1000,
          completionTokens: 500,
          cacheReadTokens: 200,
          cacheWriteTokens: 100,
        },
      },
    ];

    // Act
    const cost = priceRun({
      provider: "anthropic",
      modelId: "claude-sonnet-5",
      requests,
      at: AT,
    });

    // Assert

    // (700*2 + 200*0.2 + 100*2.5 + 500*10) / 1e6
    expect(cost.usd).toBeCloseTo(SONNET_5_CACHED_USD, DIGITS);
    expect(cost.basis).toEqual({
      kind: "price_table",
      source: "https://platform.claude.com/docs/en/about-claude/pricing",
      readOn: "2026-11-23",
    });
  });

  it("should price two models with the same token counts differently", () => {
    // Arrange
    const requests = [
      {
        outcome: "ok" as const,
        usage: { promptTokens: 1_000_000, completionTokens: 1_000_000 },
      },
    ];

    // Act
    const haiku = priceRun({
      provider: "anthropic",
      modelId: "claude-haiku-4-5",
      requests,
      at: AT,
    });
    const gpt = priceRun({
      provider: "openai",
      modelId: "gpt-5-mini",
      requests,
      at: AT,
    });

    // Assert

    // $1 + $5, and $0.25 + $2
    expect(haiku.usd).toBeCloseTo(HAIKU_4_5_ONE_MTOK_EACH_USD, DIGITS);
    expect(gpt.usd).toBeCloseTo(GPT_5_MINI_ONE_MTOK_EACH_USD, DIGITS);
  });

  it("should make a run with a failed attempt cost more than the same run without it", () => {
    // Arrange
    const ok = {
      outcome: "ok" as const,
      usage: { promptTokens: 1000, completionTokens: 500 },
    };
    const invalid = {
      outcome: "invalid" as const,
      usage: { promptTokens: 1000, completionTokens: 500 },
    };
    const run = {
      provider: "anthropic" as const,
      modelId: "claude-sonnet-5",
      at: AT,
    };

    // Act
    const clean = priceRun({ ...run, requests: [ok] });
    const retried = priceRun({ ...run, requests: [invalid, ok] });

    // Assert

    // Each attempt is 1000*2 + 500*10 = $0.007
    expect(clean.usd).toBeCloseTo(SONNET_5_ATTEMPT_USD, DIGITS);
    expect(retried.usd).toBeCloseTo(TWO_SONNET_5_ATTEMPTS_USD, DIGITS);
    expect(retried.failedRequests).toBe(1);
  });

  it("should price a request above the long-context threshold at the long-context prices", () => {
    // Arrange
    // Gpt-6.1-sol is $4 in, $15 out per 1M above 272K input tokens
    const requests = [
      {
        outcome: "ok" as const,
        usage: { promptTokens: 300_000, completionTokens: 1000 },
      },
    ];

    // Act
    const cost = priceRun({
      provider: "openai",
      modelId: "gpt-6.1-sol",
      requests,
      at: AT,
    });

    // Assert

    // 300000*4 + 1000*15 = 1_215_000 micro-dollars
    expect(cost.usd).toBeCloseTo(GPT_6_1_SOL_LONG_USD, DIGITS);
  });

  it("should use the price in force on the day of the run", () => {
    // Arrange
    // Gemini-4-argon input goes from $2 to $4 on 2026-12-01
    const requests = [
      {
        outcome: "ok" as const,
        usage: { promptTokens: 1_000_000, completionTokens: 0 },
      },
    ];
    const run = { provider: "google" as const, modelId: "gemini-4-argon" };

    // Act
    const before = priceRun({
      ...run,
      requests,
      at: new Date("2026-11-30T23:59:59Z"),
    });
    const after = priceRun({
      ...run,
      requests,
      at: new Date("2026-12-01T00:00:00Z"),
    });

    // Assert
    expect(before.usd).toBeCloseTo(ARGON_ONE_MTOK_BEFORE_USD, DIGITS);
    expect(after.usd).toBeCloseTo(ARGON_ONE_MTOK_AFTER_USD, DIGITS);
  });

  it("should report an unknown price for a model the page does not list, never zero", () => {
    // Arrange
    const requests = [
      {
        outcome: "ok" as const,
        usage: { promptTokens: 10, completionTokens: 10 },
      },
    ];

    // Act
    const unlisted = priceRun({
      provider: "openai",
      modelId: "o1",
      requests,
      at: AT,
    });
    const custom = priceRun({
      provider: "openai",
      modelId: "my-fine-tune",
      requests,
      at: AT,
    });
    const noProvider = priceRun({ modelId: "o1", requests, at: AT });

    // Assert
    expect(unlisted.usd).toBeNull();
    expect(unlisted.basis).toEqual({
      kind: "unknown",
      reason: "unpriced_model",
    });
    expect(custom.basis).toEqual({ kind: "unknown", reason: "unknown_model" });
    expect(noProvider.basis).toEqual({
      kind: "unknown",
      reason: "unknown_provider",
    });
    expect(unlisted.usage).toMatchObject({ promptTokens: 10 });
  });

  it("should count a request with no reported usage as unmeasured, not as zero tokens", () => {
    // Arrange
    const requests = [
      {
        outcome: "ok" as const,
        usage: { promptTokens: 1000, completionTokens: 500 },
      },
      { outcome: "error" as const },
    ];

    // Act
    const cost = priceRun({
      provider: "anthropic",
      modelId: "claude-sonnet-5",
      requests,
      at: AT,
    });

    // Assert
    expect(cost.usd).toBeCloseTo(SONNET_5_ATTEMPT_USD, DIGITS);
    expect(cost.unmeasuredRequests).toBe(1);
    expect(cost.failedRequests).toBe(1);
    expect(cost.requests[1]).toEqual({ outcome: "error", usd: null });
  });

  it("should not count a request the athlete stopped as a failed one", () => {
    // Arrange
    const requests = [
      {
        outcome: "ok" as const,
        usage: { promptTokens: 1000, completionTokens: 500 },
      },
      { outcome: "stopped" as const },
    ];

    // Act
    const cost = priceRun({
      provider: "anthropic",
      modelId: "claude-sonnet-5",
      requests,
      at: AT,
    });

    // Assert
    expect(cost.failedRequests).toBe(0);
    expect(cost.unmeasuredRequests).toBe(1);
  });

  it("should price a cut request at its estimate and count it as estimated", () => {
    // Arrange
    // Claude-sonnet-5 at $2 in and $10 out per 1M: 1000 in + 500 out is $0.007.
    const requests = [
      {
        outcome: "stopped" as const,
        estimated: true as const,
        usage: { promptTokens: 1000, completionTokens: 500 },
      },
    ];

    // Act
    const cost = priceRun({
      provider: "anthropic",
      modelId: "claude-sonnet-5",
      requests,
      at: AT,
    });

    // Assert
    expect(cost.usd).toBeCloseTo(SONNET_5_ATTEMPT_USD, DIGITS);
    expect(cost.estimatedRequests).toBe(1);
    expect(cost.unmeasuredRequests).toBe(0);
    expect(cost.failedRequests).toBe(0);
  });
});
