import { describe, expect, it } from "vitest";

import { createMissingFtpError, MissingFtpError } from "./missing-ftp-error";

describe("MissingFtpError", () => {
  it("should expose the adapter name and a stable error name", () => {
    // Arrange
    const adapterName = "garmin";

    // Act
    const error = createMissingFtpError(adapterName);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MissingFtpError);
    expect(error.adapterName).toBe(adapterName);
    expect(error.name).toBe("MissingFtpError");
  });

  it("should name the adapter and the percent_ftp unit in the message", () => {
    // Arrange
    const adapterName = "garmin";

    // Act
    const error = new MissingFtpError(adapterName);

    // Assert
    expect(error.message).toContain(adapterName);
    expect(error.message).toContain("percent_ftp");
    expect(error.message).toContain("FTP");
  });
});
