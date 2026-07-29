import { describe, expect, it } from "vitest";

import { ICON_MAP } from "../components/atoms/Icon";
import type { NavDestination } from "./nav-destinations";
import { NAV_DESTINATIONS, navChildrenOf } from "./nav-destinations";

const BOTTOM_NAV_CAP = 5;

/** The four chromes a destination can be opened from on a desktop viewport. */
const desktopSurfaces = (d: NavDestination): readonly string[] =>
  [
    d.surfaces.bar ? "bar" : null,
    d.surfaces.overflow ? "overflow" : null,
    d.surfaces.accountMenu ? "accountMenu" : null,
    d.parentId === undefined ? null : `nested:${d.parentId}`,
  ].filter((surface): surface is string => surface !== null);

describe("NAV_DESTINATIONS", () => {
  it("should give every destination exactly one desktop surface", () => {
    // Arrange
    const destinations = NAV_DESTINATIONS;

    // Act
    const wrong = destinations
      .map((d) => ({ id: d.id, surfaces: desktopSurfaces(d) }))
      .filter((entry) => entry.surfaces.length !== 1);

    // Assert
    expect(wrong).toEqual([]);
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

  it("should nest every child under a parent that has a header slot itself", () => {
    // Arrange
    const children = NAV_DESTINATIONS.filter((d) => d.parentId !== undefined);

    // Act
    const orphaned = children.filter((child) => {
      const parent = NAV_DESTINATIONS.find((d) => d.id === child.parentId);
      return (
        parent === undefined ||
        !(parent.surfaces.bar || parent.surfaces.overflow)
      );
    });

    // Assert
    expect(orphaned).toEqual([]);
  });

  it("should fold Labs under the Trends header entry", () => {
    // Arrange
    const labs = NAV_DESTINATIONS.find((d) => d.id === "labs");

    // Act
    const trendsChildren = navChildrenOf("trends").map((d) => d.id);

    // Assert
    expect(labs?.path).toBe("/health/labs");
    expect(trendsChildren).toEqual(["labs"]);
  });

  it("should keep account-menu destinations off the mobile bottom nav", () => {
    // Arrange
    const accountEntries = NAV_DESTINATIONS.filter(
      (d) => d.surfaces.accountMenu
    );

    // Act
    const duplicated = accountEntries.filter((d) => d.surfaces.bottomNav);

    // Assert
    expect(accountEntries.map((d) => d.id)).toEqual([
      "connections",
      "settings",
    ]);
    expect(duplicated).toEqual([]);
  });
});
