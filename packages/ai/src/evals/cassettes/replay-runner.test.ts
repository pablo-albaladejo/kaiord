import { describe, expect, it } from "vitest";

import {
  buildCassette,
  simpleWorkout,
} from "../../test-utils/cassette-builder";
import {
  FIXTURES_DIR,
  loadCassetteFiles,
  readCassetteFiles,
} from "./cassette-files";
import type { Cassette } from "./cassette-schema";
import { hashOf } from "./canonical-hash";
import { createParserReplaySuite } from "./parser-replay-suite";
import { requestHashOf } from "./request-hashes";
import type { CallOptions } from "./request-hashes";
import { replayCassettes } from "./replay-runner";

const CASE = "cycling-simple";
const UNBLOCK = "re-record locally, or retire the id in the manifest";

type JsonSchema = Record<string, unknown> & {
  properties: Record<string, Record<string, unknown>>;
};

const fresh = async () => {
  const suite = createParserReplaySuite();
  const built = await buildCassette(suite, CASE, simpleWorkout("cycling"));
  return { suite, ...built };
};

/** The request as an EARLIER revision of the schema would have sent it. */
const withEarlierSchema = (
  request: CallOptions,
  edit: (schema: JsonSchema) => unknown
): CallOptions => {
  const format = request.responseFormat;
  if (format?.type !== "json") throw new Error("expected a JSON request");
  const schema = structuredClone(format.schema) as JsonSchema;
  return {
    ...request,
    responseFormat: { ...format, schema: edit(schema) as never },
  };
};

const recordedAgainst = (
  cassette: Cassette,
  request: CallOptions,
  modelId: string
) => ({
  ...cassette,
  requestHash: requestHashOf(request, modelId),
});

describe("replayCassettes", () => {
  it("should measure and pass a fresh real cassette", async () => {
    // Arrange
    const { suite, cassette } = await fresh();

    // Act
    const result = await replayCassettes(suite, [cassette]);

    // Assert
    expect(result.faults).toEqual([]);
    expect(result.measured).toBe(1);
    expect(result.exitCode).toBe(0);
  });

  it("should fail a synthetic-only pass as zero measured", async () => {
    // Arrange
    const suite = createParserReplaySuite();
    const { cassettes, faults } = loadCassetteFiles(
      readCassetteFiles(FIXTURES_DIR)
    );

    // Act
    const result = await replayCassettes(suite, cassettes);

    // Assert
    expect(faults).toEqual([]);
    expect(cassettes.length).toBeGreaterThan(0);
    expect(cassettes.every((c) => c.recorder === "synthetic")).toBe(true);
    expect(result.measured).toBe(0);
    expect(result.faults).toEqual([
      "zero measured cases: a replay that measured nothing fails",
    ]);
    expect(result.exitCode).toBe(1);
  });

  it("should fail an empty pass as zero measured", async () => {
    // Arrange
    const suite = createParserReplaySuite();

    // Act
    const result = await replayCassettes(suite, []);

    // Assert
    expect(result.faults).toEqual([
      "zero measured cases: a replay that measured nothing fails",
    ]);
    expect(result.exitCode).toBe(1);
  });

  it("should fail a sabotaged scorer case naming the case id and the scorer", async () => {
    // Arrange
    const suite = createParserReplaySuite();
    const { cassette } = await buildCassette(
      suite,
      CASE,
      simpleWorkout("running")
    );

    // Act
    const result = await replayCassettes(suite, [cassette]);

    // Assert
    expect(result.measured).toBe(1);
    expect(result.faults).toEqual([
      'case cycling-simple failed scorer "sport": Sport mismatch: expected cycling, got running',
    ]);
    expect(result.exitCode).toBe(1);
  });

  it("should mark a changed prompt stale and name the cassette id", async () => {
    // Arrange
    const { suite, cassette } = await fresh();
    const stale = {
      ...cassette,
      prompt: { ...cassette.prompt, hash: hashOf("earlier prompt") },
    };

    // Act
    const result = await replayCassettes(suite, [stale]);

    // Assert
    expect(result.verdicts[0]).toMatchObject({
      status: "unmeasured",
      stale: ["prompt"],
    });
    expect(result.faults).toEqual([
      `stale cassettes: cycling-simple-1 — ${UNBLOCK}`,
      "zero measured cases: a replay that measured nothing fails",
    ]);
    expect(result.exitCode).toBe(1);
  });

  it("should mark a changed fixture stale", async () => {
    // Arrange
    const { suite, cassette } = await fresh();
    const stale = { ...cassette, fixtureHash: hashOf("earlier fixture") };

    // Act
    const result = await replayCassettes(suite, [stale]);

    // Assert
    expect(result.verdicts[0]).toMatchObject({ stale: ["fixture"] });
    expect(result.faults[0]).toBe(
      `stale cassettes: cycling-simple-1 — ${UNBLOCK}`
    );
  });

  it("should mark changed tools stale", async () => {
    // Arrange
    const { suite, cassette } = await fresh();
    const stale = { ...cassette, toolsHash: hashOf(["a_tool"]) };

    // Act
    const result = await replayCassettes(suite, [stale]);

    // Assert
    expect(result.verdicts[0]).toMatchObject({ stale: ["tools"] });
    expect(result.faults[0]).toBe(
      `stale cassettes: cycling-simple-1 — ${UNBLOCK}`
    );
  });

  it.each([
    [
      "a changed schema constraint",
      (s: JsonSchema) => ({ ...s, minProperties: 2 }),
    ],
    [
      "a changed field description",
      (s: JsonSchema) => ({
        ...s,
        properties: {
          ...s.properties,
          sport: { ...s.properties.sport, description: "The sport" },
        },
      }),
    ],
  ])("should mark %s stale and name the cassette id", async (_label, edit) => {
    // Arrange
    const { suite, cassette, request } = await fresh();
    const stale = recordedAgainst(
      cassette,
      withEarlierSchema(request, edit),
      suite.modelId
    );

    // Act
    const result = await replayCassettes(suite, [stale]);

    // Assert
    expect(result.verdicts[0]).toMatchObject({
      status: "unmeasured",
      stale: ["request"],
    });
    expect(result.faults[0]).toBe(
      `stale cassettes: cycling-simple-1 — ${UNBLOCK}`
    );
    expect(result.exitCode).toBe(1);
  });

  it("should mark a changed model id stale and name the cassette id", async () => {
    // Arrange
    const { suite, cassette, request } = await fresh();
    const stale = recordedAgainst(cassette, request, "claude-sonnet-4-6");

    // Act
    const result = await replayCassettes(suite, [stale]);

    // Assert
    expect(result.verdicts[0]).toMatchObject({ stale: ["request"] });
    expect(result.faults[0]).toBe(
      `stale cassettes: cycling-simple-1 — ${UNBLOCK}`
    );
  });

  it.each([
    [
      "reordered schema keys",
      (s: JsonSchema) => Object.fromEntries(Object.entries(s).reverse()),
    ],
    [
      "a new $schema URI",
      (s: JsonSchema) => ({
        ...s,
        $schema: "https://json-schema.org/draft/2019-09/schema",
      }),
    ],
  ])("should keep a cassette fresh across %s", async (_label, edit) => {
    // Arrange
    const { suite, cassette, request } = await fresh();
    const churned = recordedAgainst(
      cassette,
      withEarlierSchema(request, edit),
      suite.modelId
    );

    // Act
    const result = await replayCassettes(suite, [churned]);

    // Assert
    expect(result.faults).toEqual([]);
    expect(result.measured).toBe(1);
  });

  it("should fault a real cassette whose case no longer exists", async () => {
    // Arrange
    const { suite, cassette } = await fresh();
    const orphan = { ...cassette, id: "gone-1", caseId: "gone" };

    // Act
    const result = await replayCassettes(suite, [cassette, orphan]);

    // Assert
    expect(result.faults).toEqual([
      `cassettes without a case: gone-1 — ${UNBLOCK}`,
    ]);
    expect(result.exitCode).toBe(1);
  });
});
