import { fromBinary, toText } from "@kaiord/core";
import { loadFitFixture } from "@kaiord/core/test-utils";
import { fitReader } from "@kaiord/fit";
import { tcxWriter } from "@kaiord/tcx";
import { describe, expect, it } from "vitest";

// The code example on the landing (packages/landing/index.html) is a claim
// that those lines run. They run here, with the same imports and calls.
describe("the landing's code example", () => {
  it("should convert a FIT workout to TCX with the published entry points", async () => {
    // Arrange
    const file = loadFitFixture("WorkoutIndividualSteps.fit");

    // Act
    const krd = await fromBinary(file, fitReader);
    const tcx = await toText(krd, tcxWriter);

    // Assert
    expect(krd.type).toBe("structured_workout");
    expect(tcx).toContain("<TrainingCenterDatabase");
    expect(tcx).toContain("<Workout");
  });
});
