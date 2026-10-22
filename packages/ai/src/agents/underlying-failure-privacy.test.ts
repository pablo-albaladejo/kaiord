import { inspect } from "node:util";
import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";

import { createTextToWorkout } from "../adapters/text-to-workout";
import { HTTP_STATUS_TOO_MANY_REQUESTS } from "../test-utils/constants";
import { underlyingFailureOf } from "./underlying-failure";

const BODY_MARKER = "REQUEST-BODY-ATHLETE-ZONES";

const failingModel = (failure: APICallError) =>
  new MockLanguageModelV4({
    doGenerate: async () => {
      throw failure;
    },
  });

describe("the wrapped failure stays off the published error", () => {
  it("should not expose a retryable provider error's request body", async () => {
    // Arrange
    const failure = new APICallError({
      message: "rate limited",
      url: "https://api.example.com/v1",
      requestBodyValues: { prompt: BODY_MARKER },
      statusCode: HTTP_STATUS_TOO_MANY_REQUESTS,
      isRetryable: true,
    });
    const parse = createTextToWorkout({ model: failingModel(failure) });

    // Act
    const error = await parse("30 min easy ride").catch((e: Error) => e);

    // Assert
    expect(error.name).toBe("AiParsingError");
    expect("cause" in error).toBe(false);
    expect(inspect(error, { depth: Infinity })).not.toContain(BODY_MARKER);
    expect(underlyingFailureOf(error)).toBe(failure);
  });
});
