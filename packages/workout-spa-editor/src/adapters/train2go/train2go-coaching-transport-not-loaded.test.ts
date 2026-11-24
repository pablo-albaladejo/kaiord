import { describe, expect, it, vi } from "vitest";

import { isAppPartNotLoaded } from "../../types/app-part-not-loaded-error";
import { createTrain2GoCoachingTransport } from "./train2go-coaching-transport";

// Train2Go's parsers load on the first read; here that load fails.
vi.mock("./connector/read-train2go-answers", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

const transport = createTrain2GoCoachingTransport(() => "ext-id");

describe("Train2Go transport when its parsers do not load", () => {
  it("should reject the zones read as a part of the App that did not load", async () => {
    // Arrange
    const reading = transport.readZones!("99999");

    // Act
    const error = await reading.catch((e: unknown) => e);

    // Assert
    expect(isAppPartNotLoaded(error)).toBe(true);
  });

  it("should reject the day read as a part of the App that did not load", async () => {
    // Arrange
    const reading = transport.readDay("p1", "2026-10-12", "99999");

    // Act
    const error = await reading.catch((e: unknown) => e);

    // Assert
    expect(isAppPartNotLoaded(error)).toBe(true);
  });
});
