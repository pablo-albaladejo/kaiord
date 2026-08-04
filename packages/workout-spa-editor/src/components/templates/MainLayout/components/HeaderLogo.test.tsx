import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import type { ZoneNumber } from "../../../../lib/zone-colors";
import { HeaderLogo } from "./HeaderLogo";

const { dominantZone } = vi.hoisted(() => ({
  dominantZone: { value: null as ZoneNumber | null },
}));

vi.mock("../../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: "p1", profile: null }),
}));

vi.mock("../../../../hooks/use-week-dominant-zone", () => ({
  useWeekDominantZone: () => dominantZone.value,
}));

const ZONE_3: ZoneNumber = 3;
const ZONE_4: ZoneNumber = 4;
const ZONE_5: ZoneNumber = 5;
const ALL_ZONES: ZoneNumber[] = [1, 2, ZONE_3, ZONE_4, ZONE_5];

function renderLogo() {
  const { hook } = memoryLocation({ path: "/calendar", record: true });
  return render(
    <Router hook={hook}>
      <HeaderLogo />
    </Router>
  );
}

describe("HeaderLogo", () => {
  it("should hand the week's dominant zone to the mark as --core-live", () => {
    // Arrange
    dominantZone.value = ZONE_4;

    // Act
    renderLogo();

    // Assert
    expect(
      screen
        .getByTestId("brand-mark-wrapper")
        .style.getPropertyValue("--core-live")
    ).toBe(`var(--zone-${ZONE_4})`);
  });

  it("should declare nothing for a week with no calculable zone", () => {
    // Arrange
    dominantZone.value = null;

    // Act
    renderLogo();

    // Assert
    expect(
      screen
        .getByTestId("brand-mark-wrapper")
        .style.getPropertyValue("--core-live")
    ).toBe("");
  });

  // The one live accent inside the login takes a training-zone hue and never a
  // marketing one; that boundary is held repo-wide by check-mkt-boundary.mjs,
  // so what is worth pinning here is that every zone resolves to a zone token.
  it.each(ALL_ZONES)("should resolve zone %s to its own role token", (zone) => {
    // Arrange
    dominantZone.value = zone;

    // Act
    renderLogo();

    // Assert
    expect(
      screen
        .getByTestId("brand-mark-wrapper")
        .style.getPropertyValue("--core-live")
    ).toBe(`var(--zone-${zone})`);
  });
});
