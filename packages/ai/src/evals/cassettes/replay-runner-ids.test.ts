import { describe, expect, it } from "vitest";

import {
  buildCassette,
  simpleWorkout,
} from "../../test-utils/cassette-builder";
import { createParserReplaySuite } from "./parser-replay-suite";
import { replayCassettes } from "./replay-runner";

describe("replayCassettes fault ids", () => {
  it("should quote an id carrying a replacement pattern verbatim", async () => {
    // Arrange
    const suite = createParserReplaySuite();
    const { cassette } = await buildCassette(
      suite,
      "cycling-simple",
      simpleWorkout("cycling")
    );
    const orphan = { ...cassette, id: "gone-$&-1", caseId: "gone" };

    // Act
    const result = await replayCassettes(suite, [cassette, orphan]);

    // Assert
    expect(result.faults[0]).toContain("cassettes without a case: gone-$&-1 —");
  });
});
