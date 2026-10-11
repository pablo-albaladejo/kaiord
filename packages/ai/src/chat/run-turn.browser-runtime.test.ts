/**
 * A failed turn in a browser must not leave an unhandled rejection behind.
 *
 * `streamText` hands its tracing-channel publisher a `completion` promise
 * derived from the total usage. Outside Node the publisher returns early, and
 * before `ai@7.0.123` it did so without handling that promise: a turn with no
 * completed step rejected it with `NoOutputGeneratedError` and the page got a
 * `pageerror` even though `runTurn` itself rejected cleanly. The runtime check
 * reads `process.release.name`, so the test masks it to take the browser path.
 */
import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runTurn } from "./run-turn";

const unauthorized = () =>
  new APICallError({
    message: "invalid x-api-key",
    url: "https://api.anthropic.com/v1/messages",
    requestBodyValues: {},
    statusCode: 401,
    isRetryable: false,
  });

// Node reports an unhandled rejection once the microtask queue drains, so one
// macrotask later every leak of the failed turn has been reported.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("runTurn in a browser runtime", () => {
  const unhandled: unknown[] = [];
  const record = (reason: unknown) => unhandled.push(reason);
  const release = process.release;

  beforeEach(() => {
    Object.defineProperty(process, "release", {
      value: { name: "browser" },
      configurable: true,
    });
    process.on("unhandledRejection", record);
  });

  afterEach(() => {
    process.off("unhandledRejection", record);
    Object.defineProperty(process, "release", {
      value: release,
      configurable: true,
    });
    unhandled.length = 0;
  });

  it("should leave no unhandled rejection when the provider rejects the key", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw unauthorized();
      },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    const outcome = await runTurn({
      model,
      messages: [{ role: "user", content: "hola" }],
      tools: {},
      maxSteps: 8,
    }).catch((error: unknown) => error);
    await settle();

    // Assert
    expect(APICallError.isInstance(outcome)).toBe(true);
    expect(unhandled.map(String)).toEqual([]);
  });
});
