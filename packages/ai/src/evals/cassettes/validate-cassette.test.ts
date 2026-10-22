import { describe, expect, it } from "vitest";

import {
  buildCassette,
  simpleWorkout,
} from "../../test-utils/cassette-builder";
import type { Cassette } from "./cassette-schema";
import { createParserReplaySuite } from "./parser-replay-suite";
import {
  validateCassette,
  validateCommittedCassette,
} from "./validate-cassette";

const realCassette = async () => {
  const suite = createParserReplaySuite();
  const { cassette } = await buildCassette(
    suite,
    "cycling-simple",
    simpleWorkout("cycling")
  );
  return cassette;
};

const errorsOf = (result: ReturnType<typeof validateCassette>) =>
  result.ok ? [] : result.errors;

describe("validateCassette", () => {
  it("should accept a cassette carrying only allowlisted keys", async () => {
    // Arrange
    const cassette = await realCassette();

    // Act
    const result = validateCassette(cassette);

    // Assert
    expect(errorsOf(result)).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("should reject an unknown root key and name it", async () => {
    // Arrange
    const cassette = { ...(await realCassette()), cwd: "/Users/someone" };

    // Act
    const result = validateCassette(cassette);

    // Assert
    expect(result.ok).toBe(false);
    expect(errorsOf(result).join("\n")).toContain('"cwd"');
  });

  it("should reject an unknown nested key and name it with its path", async () => {
    // Arrange
    const base = await realCassette();
    const cassette = {
      ...base,
      response: {
        ...base.response,
        usage: { ...base.response.usage, session_id: "abc" },
      },
    };

    // Act
    const result = validateCassette(cassette);

    // Assert
    expect(errorsOf(result)).toEqual([
      'unknown key(s) "session_id" at response.usage',
    ]);
  });

  it.each([
    ["prompt", (c: Cassette) => ({ ...c, prompt: { ...c.prompt, uuid: "u" } })],
    [
      "sampling",
      (c: Cassette) => ({ ...c, sampling: { ...c.sampling, cwd: "/h" } }),
    ],
    [
      "response",
      (c: Cassette) => ({
        ...c,
        response: { ...c.response, rate_limit_info: {} },
      }),
    ],
  ])(
    "should reject an unknown key at the %s level and name it",
    async (level, edit) => {
      // Arrange
      const cassette = edit(await realCassette());

      // Act
      const result = validateCassette(cassette);

      // Assert
      expect(errorsOf(result)).toHaveLength(1);
      expect(errorsOf(result)[0]).toMatch(
        new RegExp(`^unknown key\\(s\\) "\\w+" at ${level}$`)
      );
    }
  );

  it("should reject a real recording that omits a parity warning", async () => {
    // Arrange
    const cassette = {
      ...(await realCassette()),
      parityWarnings: ["temperature-not-honoured", "hidden-system-overhead"],
    };

    // Act
    const result = validateCassette(cassette);

    // Assert
    expect(errorsOf(result).join("\n")).toContain(
      "max-output-tokens-not-honoured"
    );
  });

  it("should accept an in-memory claude-cli cassette of an iteration model", async () => {
    // Arrange
    const cassette = {
      ...(await realCassette()),
      requestedModelId: "claude-haiku-4-5",
      servedModelId: "claude-haiku-4-5",
    };

    // Act
    const result = validateCassette(cassette);

    // Assert
    expect(result.ok).toBe(true);
  });
});

describe("validateCommittedCassette", () => {
  it("should reject a committed cassette served by another model", async () => {
    // Arrange
    const cassette = {
      ...(await realCassette()),
      servedModelId: "claude-haiku-4-5",
    };

    // Act
    const result = validateCommittedCassette(cassette);

    // Assert
    expect(errorsOf(result)).toEqual([
      "cycling-simple-1: served claude-haiku-4-5, not recorded with claude-sonnet-5",
    ]);
  });

  it("should reject a committed cassette that requested another model", async () => {
    // Arrange
    const cassette = {
      ...(await realCassette()),
      requestedModelId: "claude-haiku-5-5",
    };

    // Act
    const result = validateCommittedCassette(cassette);

    // Assert
    expect(errorsOf(result).join("\n")).toContain(
      "requested claude-haiku-5-5, not recorded with claude-sonnet-5"
    );
  });

  it.each(["claude-sonnet-5", "claude-sonnet-5-20261001"])(
    "should accept a committed cassette served as %s",
    async (servedModelId) => {
      // Arrange
      const cassette = { ...(await realCassette()), servedModelId };

      // Act
      const result = validateCommittedCassette(cassette);

      // Assert
      expect(result.ok).toBe(true);
    }
  );

  it.each(["claude-sonnet-5-1", "claude-sonnet-5-2026100", "claude-sonnet-5x"])(
    "should reject the served id %s as not a dated snapshot",
    async (servedModelId) => {
      // Arrange
      const cassette = { ...(await realCassette()), servedModelId };

      // Act
      const result = validateCommittedCassette(cassette);

      // Assert
      expect(result.ok).toBe(false);
    }
  );
});
