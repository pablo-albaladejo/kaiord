import { describe, expect, it } from "vitest";

import { ICON_MAP } from "../components/atoms/Icon";
import { NAV_DESTINATIONS } from "./nav-destinations";

const BOTTOM_NAV_CAP = 5;

describe("NAV_DESTINATIONS", () => {
  it("should expose every destination through the header surface", () => {
    // Arrange
    const destinations = NAV_DESTINATIONS;

    // Act
    const missingHeader = destinations.filter((d) => !d.surfaces.header);

    // Assert
    expect(missingHeader).toEqual([]);
  });

  it("should cap the bottom-nav surface at 5 destinations", () => {
    // Arrange
    const destinations = NAV_DESTINATIONS;

    // Act
    const bottomNavCount = destinations.filter(
      (d) => d.surfaces.bottomNav
    ).length;

    // Assert
    expect(bottomNavCount).toBeLessThanOrEqual(BOTTOM_NAV_CAP);
  });

  it("should resolve every destination icon in ICON_MAP", () => {
    // Arrange
    const destinations = NAV_DESTINATIONS;

    // Act
    const unresolved = destinations.filter((d) => !(d.icon in ICON_MAP));

    // Assert
    expect(unresolved).toEqual([]);
  });

  it("should use unique ids and paths across destinations", () => {
    // Arrange
    const ids = NAV_DESTINATIONS.map((d) => d.id);
    const paths = NAV_DESTINATIONS.map((d) => d.path);

    // Act
    const uniqueIds = new Set(ids);
    const uniquePaths = new Set(paths);

    // Assert
    expect(uniqueIds.size).toBe(ids.length);
    expect(uniquePaths.size).toBe(paths.length);
  });

  it("should mark every destination reachable on both desktop and mobile", () => {
    // Arrange
    const destinations = NAV_DESTINATIONS;

    // Act
    // Desktop only ever renders the header nav (bottom nav is `md:hidden`);
    // mobile renders both the header nav and the bottom nav. So header
    // alone already guarantees both platforms, while bottomNav is an
    // additional mobile-only affordance layered on top of it.
    const unreachable = destinations.filter((d) => {
      const desktopReachable = d.surfaces.header;
      const mobileReachable = d.surfaces.header || d.surfaces.bottomNav;
      return !(desktopReachable && mobileReachable);
    });

    // Assert
    expect(unreachable).toEqual([]);
  });
});
