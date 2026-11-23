import { describe, expect, it } from "vitest";

import { DEVICE_LOCAL_TABLES } from "../sync/device-local-tables";
import { KEPT_ON_DEVICE } from "./kept-on-device";

describe("KEPT_ON_DEVICE", () => {
  it("should list the Traces and the usage log, each a store that never leaves the device", () => {
    // Arrange
    const local: readonly string[] = DEVICE_LOCAL_TABLES;

    // Act
    const notLocal = KEPT_ON_DEVICE.filter((id) => !local.includes(id));

    // Assert
    expect(KEPT_ON_DEVICE).toEqual(["traces", "usageEvents"]);
    expect(notLocal).toEqual([]);
  });
});
