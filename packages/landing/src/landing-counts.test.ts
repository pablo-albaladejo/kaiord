import { describe, expect, it } from "vitest";

// The landing states how many browser extensions there are. Each extension
// is one `packages/*-bridge` package with a production manifest, so the
// count is the number of those manifests.
const manifests = import.meta.glob("../../*-bridge/manifest.prod.json");

describe("landing counts", () => {
  it("should count five browser extensions, one manifest per bridge package", () => {
    // Arrange
    const paths = Object.keys(manifests);

    // Act
    const bridges = paths.map((path) => path.split("/")[2]).sort();

    // Assert
    expect(bridges).toEqual([
      "garmin-bridge",
      "tanita-bridge",
      "train2go-bridge",
      "trainingpeaks-bridge",
      "whoop-bridge",
    ]);
  });
});
