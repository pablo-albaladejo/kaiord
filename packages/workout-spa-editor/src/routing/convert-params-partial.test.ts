import { describe, expect, it } from "vitest";

import { acceptFor, partialConvertParams } from "./convert-params";

describe("partialConvertParams", () => {
  it("should keep only the side of the link that is valid", () => {
    // Arrange
    const searches = ["from=zwo&to=nope", "from=krd&to=garmin", "to=fit"];

    // Act
    const partials = searches.map(partialConvertParams);

    // Assert
    expect(partials).toEqual([{ from: "zwo" }, { to: "gcn" }, { to: "fit" }]);
  });
});

describe("acceptFor", () => {
  it("should restrict the file picker to the source format", () => {
    // Arrange
    const sources = ["fit", "tcx", "zwo", "gcn"] as const;

    // Act
    const accepts = sources.map(acceptFor);

    // Assert
    expect(accepts).toEqual([".fit", ".tcx", ".zwo", ".json,.gcn"]);
  });
});
