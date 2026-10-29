import type * as FitModule from "@kaiord/fit";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createRemoteTestClient,
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import {
  loadFitFixture,
  loadKrdFixtureRaw,
} from "../tests/helpers/test-fixtures";
import { encodeBase64 } from "../utils/base64";

const createFitWriterSpy = vi.hoisted(() => vi.fn());

vi.mock("@kaiord/fit", async (importOriginal) => {
  const actual = await importOriginal<typeof FitModule>();
  createFitWriterSpy.mockImplementation(actual.createFitWriter);
  return { ...actual, createFitWriter: createFitWriterSpy };
});

const SIXTEEN_MIB = 16_777_216;
const CAP = { maxOutputBytes: SIXTEEN_MIB };
const KRD = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
const FIT_B64 = encodeBase64(loadFitFixture("WorkoutIndividualSteps.fit"));

const convertArgs = {
  input_content: KRD,
  input_format: "krd",
  output_format: "fit",
};

describe("fitWriter option", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should reach the FIT writer of both convert and round-trip validation", async () => {
    // Arrange
    const client = await createRemoteTestClient({ fitWriter: CAP });

    // Act
    const converted = (await client.callTool({
      name: "kaiord_convert",
      arguments: convertArgs,
    })) as McpToolResult;
    const validated = (await client.callTool({
      name: "kaiord_round_trip_validate",
      arguments: { input_content: FIT_B64 },
    })) as McpToolResult;

    // Assert
    expect(converted.isError).toBeUndefined();
    expect(validated.isError).toBeUndefined();
    expect(createFitWriterSpy).toHaveBeenCalledTimes(2);
    for (const [, options] of createFitWriterSpy.mock.calls) {
      expect(options).toEqual(CAP);
    }
  });

  it("should build an uncapped FIT writer when no option is given", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    await client.callTool({ name: "kaiord_convert", arguments: convertArgs });

    // Assert
    expect(createFitWriterSpy).toHaveBeenCalledWith(
      expect.anything(),
      undefined
    );
  });
});
