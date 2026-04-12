import { describe, expect, it } from "vitest";

import { validateSanity } from "./sanity-checks";
import { makeValidKrd } from "./test-helpers";

describe("validateSanity", () => {
  it("returns null for valid KRD", () => {
    const krd = makeValidKrd(5, 3600);

    const result = validateSanity(krd);

    expect(result).toBeNull();
  });

  it("rejects zero steps", () => {
    const krd = makeValidKrd(0, 3600);

    const result = validateSanity(krd);

    expect(result).toContain("Step count 0");
  });

  it("rejects more than 200 steps", () => {
    const krd = makeValidKrd(201, 3600);

    const result = validateSanity(krd);

    expect(result).toContain("Step count 201");
  });

  it("rejects duration under 1 minute", () => {
    const krd = makeValidKrd(3, 30);

    const result = validateSanity(krd);

    expect(result).toContain("Duration 30s");
  });

  it("rejects duration over 8 hours", () => {
    const krd = makeValidKrd(3, 30000);

    const result = validateSanity(krd);

    expect(result).toContain("Duration 30000s");
  });

  it("accepts KRD without structured_workout extension", () => {
    const krd = makeValidKrd();
    delete krd.extensions;

    const result = validateSanity(krd);

    expect(result).toBeNull();
  });

  it("accepts KRD with no steps array", () => {
    const krd = makeValidKrd();
    const ext = krd.extensions!["structured_workout"] as Record<
      string,
      unknown
    >;
    delete ext["steps"];

    const result = validateSanity(krd);

    expect(result).toBeNull();
  });

  it("accepts KRD with no estimatedDuration", () => {
    const krd = makeValidKrd();
    const ext = krd.extensions!["structured_workout"] as Record<
      string,
      unknown
    >;
    delete ext["estimatedDuration"];

    const result = validateSanity(krd);

    expect(result).toBeNull();
  });
});
