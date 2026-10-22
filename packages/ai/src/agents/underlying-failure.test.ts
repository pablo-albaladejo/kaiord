import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";

import { createTextToWorkout } from "../adapters/text-to-workout";
import {
  keepUnderlyingFailure,
  underlyingFailureOf,
} from "./underlying-failure";

describe("underlyingFailureOf", () => {
  it("should return the last raw failure behind the runtime's error", async () => {
    // Arrange
    const failures = [
      new Error("first"),
      new Error("second"),
      new Error("last"),
    ];
    let attempt = 0;
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw failures[attempt++];
      },
    });

    // Act
    const error = await createTextToWorkout({ model })(
      "30 min easy ride"
    ).catch((e: Error) => e);

    // Assert
    expect(attempt).toBe(failures.length);
    expect(underlyingFailureOf(error)).toBe(failures[2]);
  });

  it("should return undefined when no failure was kept", () => {
    // Arrange
    const kept = keepUnderlyingFailure(new Error("wrapper"), undefined);

    // Act
    const failures = [
      underlyingFailureOf(kept),
      underlyingFailureOf(new Error("never wrapped")),
      underlyingFailureOf("not an error"),
    ];

    // Assert
    expect(failures).toEqual([undefined, undefined, undefined]);
  });
});
