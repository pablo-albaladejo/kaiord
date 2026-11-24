import { describe, expect, it } from "vitest";

import { connectionFixHref } from "./connection-fix-target";

const GARMIN_LISTING =
  "https://chromewebstore.google.com/detail/kaiord-garmin-bridge/innelncjhkdokailkinkchppgekennoe";
const INSTALL_GUIDE = "https://kaiord.com/docs/guide/install-extensions";

describe("connectionFixHref", () => {
  it.each(["install", "update"] as const)(
    "should open Garmin's store listing to %s it",
    (fix) => {
      // Arrange
      const bridgeId = "garmin-bridge";

      // Act
      const href = connectionFixHref(fix, bridgeId);

      // Assert
      expect(href).toBe(GARMIN_LISTING);
    }
  );

  // Train2Go is published, but the repo holds no address of its listing
  // (its id is a CI secret), so it shares the guide that names it.
  it.each([
    "train2go-bridge",
    "tanita-bridge",
    "trainingpeaks-bridge",
    "whoop-bridge",
    "unknown-bridge",
  ])(
    "should open the install guide, whose address never says bridge, for %s",
    (bridgeId) => {
      // Arrange
      const fixes = ["install", "update"] as const;

      // Act
      const hrefs = fixes.map((fix) => connectionFixHref(fix, bridgeId));

      // Assert
      expect(hrefs).toEqual([INSTALL_GUIDE, INSTALL_GUIDE]);
      expect(INSTALL_GUIDE).not.toMatch(/bridge/i);
    }
  );
});
