import { describe, expect, it } from "vitest";

import { createNotSupportedConnectionProvider } from "./not-supported-connection-provider";

describe("createNotSupportedConnectionProvider", () => {
  it("should report a not-supported status", async () => {
    // Arrange
    const provider = createNotSupportedConnectionProvider("strava");

    // Act
    const status = await provider.status("p1");

    // Assert
    expect(status).toBe("not-supported");
  });

  it("should reject any attempt to connect", async () => {
    // Arrange
    const provider = createNotSupportedConnectionProvider("strava");

    // Act
    const attempt = provider.connect({ profileId: "p1" });

    // Assert
    await expect(attempt).rejects.toThrow(/not supported yet/i);
  });
});
