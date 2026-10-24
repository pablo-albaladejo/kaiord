import { describe, expect, it } from "vitest";

import benchmarks from "../benchmarks.json";
import { COMMITTED_DIR, readCassetteFiles } from "./cassette-files";
import { replayCommitted } from "./committed-directory";
import { createParserReplaySuite } from "./parser-replay-suite";

describe("the replay lane over the committed cassettes", () => {
  it("should replay green and measure every benchmark", async () => {
    // Arrange
    const suite = createParserReplaySuite();
    const files = readCassetteFiles(COMMITTED_DIR);

    // Act
    const result = await replayCommitted(suite, files);

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.faults).toEqual([]);
    expect(new Set(result.verdicts.map((v) => v.caseId))).toEqual(
      new Set(benchmarks.map((b) => b.id))
    );
  });
});
