import { describe, expect, it } from "vitest";
import { FORMAT_REGISTRY, detectFormatFromPath } from "./format-registry";

describe("FORMAT_REGISTRY", () => {
  it("should have entries for all five formats", () => {
    const keys = Object.keys(FORMAT_REGISTRY);

    expect(keys).toContain("fit");
    expect(keys).toContain("tcx");
    expect(keys).toContain("zwo");
    expect(keys).toContain("gcn");
    expect(keys).toContain("krd");
    expect(keys).toHaveLength(5);
  });

  it("should mark FIT as binary", () => {
    expect(FORMAT_REGISTRY.fit.binary).toBe(true);
  });

  it("should mark text formats as non-binary", () => {
    expect(FORMAT_REGISTRY.tcx.binary).toBe(false);
    expect(FORMAT_REGISTRY.zwo.binary).toBe(false);
    expect(FORMAT_REGISTRY.gcn.binary).toBe(false);
    expect(FORMAT_REGISTRY.krd.binary).toBe(false);
  });

  it("should have correct extensions", () => {
    expect(FORMAT_REGISTRY.fit.extension).toBe(".fit");
    expect(FORMAT_REGISTRY.tcx.extension).toBe(".tcx");
    expect(FORMAT_REGISTRY.zwo.extension).toBe(".zwo");
    expect(FORMAT_REGISTRY.gcn.extension).toBe(".gcn");
    expect(FORMAT_REGISTRY.krd.extension).toBe(".krd");
  });
});

describe("detectFormatFromPath", () => {
  it("should detect FIT format from file path", () => {
    expect(detectFormatFromPath("/path/to/file.fit")).toBe("fit");
  });

  it("should detect TCX format from file path", () => {
    expect(detectFormatFromPath("/path/to/file.tcx")).toBe("tcx");
  });

  it("should detect ZWO format from file path", () => {
    expect(detectFormatFromPath("workout.zwo")).toBe("zwo");
  });

  it("should detect GCN format from file path", () => {
    expect(detectFormatFromPath("workout.gcn")).toBe("gcn");
  });

  it("should detect KRD format from file path", () => {
    expect(detectFormatFromPath("data.krd")).toBe("krd");
  });

  it("should be case-insensitive for extensions", () => {
    expect(detectFormatFromPath("file.FIT")).toBe("fit");
    expect(detectFormatFromPath("file.Tcx")).toBe("tcx");
  });

  it("should return null for unknown extensions", () => {
    expect(detectFormatFromPath("file.txt")).toBeNull();
    expect(detectFormatFromPath("file.json")).toBeNull();
  });

  it("should return null for paths without extensions", () => {
    expect(detectFormatFromPath("noextension")).toBeNull();
  });

  it("should return null for filenames matching format names without dot", () => {
    expect(detectFormatFromPath("fit")).toBeNull();
    expect(detectFormatFromPath("tcx")).toBeNull();
  });
});
