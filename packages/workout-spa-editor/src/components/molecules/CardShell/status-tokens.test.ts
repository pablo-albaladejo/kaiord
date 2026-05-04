import { describe, expect, it } from "vitest";

import {
  complianceBucketToBorderClass,
  statusToColourClass,
  statusToIcon,
} from "./status-tokens";

describe("statusToColourClass", () => {
  it("should map pending to amber-600", () => {
    expect(statusToColourClass("pending")).toBe("border-amber-600");
  });

  it("should map completed to emerald-600", () => {
    expect(statusToColourClass("completed")).toBe("border-emerald-600");
  });

  it("should map skipped to slate-500", () => {
    expect(statusToColourClass("skipped")).toBe("border-slate-500");
  });
});

describe("statusToIcon", () => {
  it("returns Clock with 'Pending' label for pending", () => {
    const icon = statusToIcon("pending");
    expect(icon.label).toBe("Pending");
    expect(icon.Component).toBeDefined();
  });

  it("returns Check with 'Completed' label for completed", () => {
    const icon = statusToIcon("completed");
    expect(icon.label).toBe("Completed");
  });

  it("returns Minus with 'Skipped' label for skipped", () => {
    const icon = statusToIcon("skipped");
    expect(icon.label).toBe("Skipped");
  });
});

describe("complianceBucketToBorderClass", () => {
  it("should map neutral to slate-500 (slate-400 fails WCAG 1.4.11)", () => {
    expect(complianceBucketToBorderClass("neutral")).toBe("border-slate-500");
  });

  it("should map amber to amber-600", () => {
    expect(complianceBucketToBorderClass("amber")).toBe("border-amber-600");
  });

  it("should map emerald to emerald-600", () => {
    expect(complianceBucketToBorderClass("emerald")).toBe("border-emerald-600");
  });

  it("should map mid to a gradient class involving amber and emerald", () => {
    const cls = complianceBucketToBorderClass("mid");
    expect(cls).toContain("amber");
    expect(cls).toContain("emerald");
  });
});
