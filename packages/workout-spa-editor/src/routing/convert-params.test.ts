import { describe, expect, it } from "vitest";

import { convertHref, parseConvertParams } from "./convert-params";

describe("parseConvertParams", () => {
  it("should read a valid pair from the fragment query", () => {
    // Arrange
    const search = "from=fit&to=tcx";

    // Act
    const pair = parseConvertParams(search);

    // Assert
    expect(pair).toEqual({ from: "fit", to: "tcx" });
  });

  it("should map the public garmin name to the gcn format on both sides", () => {
    // Arrange
    const searches = ["from=garmin&to=zwo", "from=zwo&to=garmin"];

    // Act
    const pairs = searches.map(parseConvertParams);

    // Assert
    expect(pairs).toEqual([
      { from: "gcn", to: "zwo" },
      { from: "zwo", to: "gcn" },
    ]);
  });

  it("should accept upper-case values", () => {
    // Arrange
    const search = "from=ZWO&to=FIT";

    // Act
    const pair = parseConvertParams(search);

    // Assert
    expect(pair).toEqual({ from: "zwo", to: "fit" });
  });

  it("should reject krd as a source but accept it as a target", () => {
    // Arrange
    const asSource = "from=krd&to=fit";
    const asTarget = "from=fit&to=krd";

    // Act
    const results = [asSource, asTarget].map(parseConvertParams);

    // Assert
    expect(results).toEqual([null, { from: "fit", to: "krd" }]);
  });

  it("should return null for unknown, missing or identical formats", () => {
    // Arrange
    const searches = ["from=bogus&to=fit", "from=fit", "", "from=fit&to=fit"];

    // Act
    const results = searches.map(parseConvertParams);

    // Assert
    expect(results).toEqual([null, null, null, null]);
  });
});

describe("convertHref", () => {
  it("should build the in-app deep link for a pair", () => {
    // Arrange
    const pair = { from: "zwo", to: "fit" } as const;

    // Act
    const href = convertHref(pair);

    // Assert
    expect(href).toBe("/convert?from=zwo&to=fit");
  });
});
