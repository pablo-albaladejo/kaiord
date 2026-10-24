import { describe, expect, it } from "vitest";

import benchmarks from "../benchmarks.json";
import { COMMITTED_DIR, readCassetteFiles } from "./cassette-files";
import { replayCommitted } from "./committed-directory";
import { createParserReplaySuite } from "./parser-replay-suite";

describe("the replay lane over the committed cassettes", () => {
  it("should measure every benchmark with no fault and nothing stale", async () => {
    // Arrange
    const suite = createParserReplaySuite();
    const files = readCassetteFiles(COMMITTED_DIR);

    // Act
    const result = await replayCommitted(suite, files);

    // Assert
    expect(result.faults).toEqual([]);
    expect(result.exitCode).toBe(0);
    expect(result.measured).toBe(benchmarks.length);
    expect(result.verdicts.map((v) => v.status)).not.toContain("unmeasured");
  });
});
