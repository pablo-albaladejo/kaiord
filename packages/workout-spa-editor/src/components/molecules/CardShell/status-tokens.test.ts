import { describe, expect, it } from "vitest";

import {
  complianceBucketToBorderClass,
  statusToColourClass,
  statusToIcon,
} from "./status-tokens";

describe("statusToColourClass", () => {
  it("should map pending to amber-600", () => {
    // Arrange

    // Act

    // Assert
    expect(statusToColourClass("pending")).toBe("border-amber-600");
  });

  it("should map completed to emerald-600", () => {
    // Arrange

    // Act

    // Assert
    expect(statusToColourClass("completed")).toBe("border-emerald-600");
  });

  it("should map skipped to slate-500", () => {
    // Arrange

    // Act

    // Assert
    expect(statusToColourClass("skipped")).toBe("border-slate-500");
  });
});

describe("statusToIcon", () => {
  it("should return Clock with 'Pending' label for pending", () => {
    // Arrange

    // Act

    const icon = statusToIcon("pending");

    // Assert

    expect(icon.label).toBe("Pending");
    expect(icon.Component).toBeDefined();
  });

  it("should return Check with 'Completed' label for completed", () => {
    // Arrange

    // Act

    const icon = statusToIcon("completed");

    // Assert

    expect(icon.label).toBe("Completed");
  });

  it("should return Minus with 'Skipped' label for skipped", () => {
    // Arrange

    // Act

    const icon = statusToIcon("skipped");

    // Assert

    expect(icon.label).toBe("Skipped");
  });
});

describe("complianceBucketToBorderClass", () => {
  it("should map neutral to slate-500 (slate-400 fails WCAG 1.4.11)", () => {
    // Arrange

    // Act

    // Assert
    expect(complianceBucketToBorderClass("neutral")).toBe("border-slate-500");
  });

  it("should map amber to amber-600", () => {
    // Arrange

    // Act

    // Assert
    expect(complianceBucketToBorderClass("amber")).toBe("border-amber-600");
  });

  it("should map emerald to emerald-600", () => {
    // Arrange

    // Act

    // Assert
    expect(complianceBucketToBorderClass("emerald")).toBe("border-emerald-600");
  });

  it("should map mid to a gradient class involving amber and emerald", () => {
    // Arrange

    // Act

    const cls = complianceBucketToBorderClass("mid");

    // Assert

    expect(cls).toContain("amber");
    expect(cls).toContain("emerald");
  });
});
