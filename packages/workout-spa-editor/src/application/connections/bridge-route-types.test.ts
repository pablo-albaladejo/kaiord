import { describe, expect, it } from "vitest";

import { bridgeSupportsRoute } from "../../integrations/bridge-supported-routes";
import { bridgeRouteTypes } from "./bridge-route-types";

/** Announces everything — isolates the supported-route filter. */
const announcesAll = {
  announces: () => true,
  supportsRoute: bridgeSupportsRoute,
};

describe("bridgeRouteTypes", () => {
  it("should narrow an over-claiming export manifest to the cabled route", () => {
    // Arrange
    // `trainingpeaks-bridge` announces `write:body` as well as
    // `write:workouts`, but the SPA cables only the workout push. A
    // manifest-derived chip would otherwise tell the user Kaiord pushes body
    // data it never pushes.
    const bridgeId = "trainingpeaks-bridge";

    // Act
    const types = bridgeRouteTypes(bridgeId, "export", announcesAll);

    // Assert
    expect(types).toEqual(["workout"]);
    expect(types).not.toContain("weight");
  });

  it("should narrow a shared import token to the routes the SPA serves", () => {
    // Arrange
    // `read:body` spans weight, hrv, daily-wellness, body-composition, stress,
    // strain, vitals and heart-rate-series; Tanita reads only two of them.
    const bridgeId = "tanita-bridge";

    // Act
    const types = bridgeRouteTypes(bridgeId, "import", announcesAll);

    // Assert
    expect(types).toEqual(["weight", "body-composition"]);
  });

  it("should report nothing for a bridge that announces no token", () => {
    // Arrange
    const silent = {
      announces: () => false,
      supportsRoute: bridgeSupportsRoute,
    };

    // Act
    const types = bridgeRouteTypes("garmin-bridge", "import", silent);

    // Assert
    expect(types).toEqual([]);
  });
});
