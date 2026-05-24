import { describe, expect, it } from "vitest";

import {
  createUnsupportedKrdTypeError,
  UnsupportedKrdTypeError,
} from "./unsupported-krd-type-error";

describe("UnsupportedKrdTypeError", () => {
  it("should expose krdType and adapterName on the instance", () => {
    // Arrange
    const krdType = "sleep_record" as const;
    const adapterName = "tcx";

    // Act
    const error = new UnsupportedKrdTypeError(krdType, adapterName);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(UnsupportedKrdTypeError);
    expect(error.krdType).toBe(krdType);
    expect(error.adapterName).toBe(adapterName);
    expect(error.name).toBe("UnsupportedKrdTypeError");
  });

  it("should include both fields in the rendered message", () => {
    // Arrange
    const krdType = "weight_measurement" as const;
    const adapterName = "zwo";

    // Act
    const error = createUnsupportedKrdTypeError(krdType, adapterName);

    // Assert
    expect(error.message).toContain(adapterName);
    expect(error.message).toContain(krdType);
  });

  it("should be discoverable via instanceof from a generic Error catch", () => {
    // Arrange
    const thrower = () => {
      throw createUnsupportedKrdTypeError("daily_wellness", "garmin");
    };

    // Act
    let caught: unknown = null;
    try {
      thrower();
    } catch (error) {
      caught = error;
    }

    // Assert
    expect(caught).toBeInstanceOf(UnsupportedKrdTypeError);
    if (caught instanceof UnsupportedKrdTypeError) {
      expect(caught.krdType).toBe("daily_wellness");
      expect(caught.adapterName).toBe("garmin");
    }
  });
});
