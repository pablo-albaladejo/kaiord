import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { renderThirdPartyLicenses } from "./generate-third-party-licenses.mjs";

const entry = (name, version, license, homepage) => ({
  name,
  versions: [version],
  paths: [`/home/someone/node_modules/${name}`],
  license,
  homepage,
});

describe("generate-third-party-licenses", () => {
  it("should list each package under its license, sorted, without any local path", () => {
    // Arrange
    const report = {
      MIT: [
        entry("zod", "4.6.7", "MIT", "https://zod.dev"),
        entry("ai", "6.0.1", "MIT", "https://ai-sdk.dev"),
      ],
      "Apache-2.0": [entry("@ai-sdk/google", "4.0.99", "Apache-2.0")],
    };

    // Act
    const text = renderThirdPartyLicenses(report);

    // Assert
    assert.ok(!text.includes("/home/someone"));
    assert.ok(
      text.indexOf("## Apache-2.0") < text.indexOf("## MIT"),
      "licenses sorted by name"
    );
    assert.ok(
      text.indexOf("| ai | 6.0.1 | https://ai-sdk.dev |") <
        text.indexOf("| zod | 4.6.7 | https://zod.dev |"),
      "packages sorted by name"
    );
    assert.ok(text.includes("| @ai-sdk/google | 4.0.99 |  |"));
  });

  it("should name Garmin's FIT SDK under its own agreement, not as an unknown license", () => {
    // Arrange
    const report = {
      Unknown: [
        entry(
          "@garmin/fitsdk",
          "21.218.0",
          "Unknown",
          "https://github.com/garmin/fit-javascript-sdk#readme"
        ),
      ],
    };

    // Act
    const text = renderThirdPartyLicenses(report);

    // Assert
    assert.ok(
      text.includes(
        "## Flexible and Interoperable Data Transfer (FIT) Protocol License Agreement"
      )
    );
    assert.ok(
      text.includes(
        "https://github.com/garmin/fit-javascript-sdk/blob/main/LICENSE.txt"
      )
    );
    assert.ok(!text.includes("## Unknown"));
  });

  it("should say how the file is regenerated", () => {
    // Arrange
    const report = { MIT: [entry("zod", "4.6.7", "MIT")] };

    // Act
    const text = renderThirdPartyLicenses(report);

    // Assert
    assert.ok(text.includes("pnpm run licenses:text"));
  });
});
