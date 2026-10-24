import { beforeEach, describe, expect, it, vi } from "vitest";

import { estimateZoneProfile } from "./estimate-zone-profile";
import { hide } from "./estimate-zone-profile-hide";
import { normalizeCoachText } from "./estimate-zone-profile-normalize";

vi.mock("./estimate-zone-profile-normalize", () => ({
  normalizeCoachText: vi.fn(),
  isUnreadable: () => false,
}));

describe("estimateZoneProfile (error handling)", () => {
  beforeEach(() => {
    vi.mocked(normalizeCoachText).mockReset();
  });

  it("should turn the hide sentinel into no estimate", () => {
    // Arrange
    vi.mocked(normalizeCoachText).mockImplementation(hide);

    // Act
    const segments = estimateZoneProfile("5' z1");

    // Assert
    expect(segments).toEqual([]);
  });

  it("should rethrow any other error so a real bug surfaces", () => {
    // Arrange
    const bug = new TypeError("bug");
    vi.mocked(normalizeCoachText).mockImplementation(() => {
      throw bug;
    });

    // Act
    const run = () => estimateZoneProfile("5' z1");

    // Assert
    expect(run).toThrow(bug);
  });
});
