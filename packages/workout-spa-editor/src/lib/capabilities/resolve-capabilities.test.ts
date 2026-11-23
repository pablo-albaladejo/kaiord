import { describe, expect, it } from "vitest";

import type { CapabilityDeclaration } from "./capability-catalogue";
import { resolveCapabilities } from "./resolve-capabilities";

const TEMPLATES: CapabilityDeclaration = {
  id: "templates",
  owns: {
    nav: ["library"],
    routes: ["/library"],
    settings: [],
    commands: [],
    shortcuts: [],
    tools: [],
  },
  modules: [],
  adoptsExistingData: "templates",
};

const MATRIX: CapabilityDeclaration = {
  id: "authority-matrix",
  grade: "advanced",
  owns: {
    nav: [],
    routes: [],
    settings: ["data-routes"],
    commands: ["open-matrix"],
    shortcuts: ["matrix"],
    tools: ["set_data_route"],
  },
  modules: [],
};

const CATALOGUE = [TEMPLATES, MATRIX];

describe("resolveCapabilities", () => {
  it("should keep every Capability off for a new athlete", () => {
    // Arrange
    const input = { decisions: {}, withData: new Set<string>() };

    // Act
    const active = resolveCapabilities(input, CATALOGUE);

    // Assert
    expect(active.isOn("templates")).toBe(false);
    expect(active.isOn("authority-matrix")).toBe(false);
    expect(active.offers("nav", "library")).toBe(false);
    expect(active.offers("route", "/library")).toBe(false);
  });

  it("should offer every surface of a Capability the athlete activated", () => {
    // Arrange
    const input = {
      decisions: { "authority-matrix": true },
      withData: new Set<string>(),
    };

    // Act
    const active = resolveCapabilities(input, CATALOGUE);

    // Assert
    expect(active.isOn("authority-matrix")).toBe(true);
    expect(active.offers("settings", "data-routes")).toBe(true);
    expect(active.offers("command", "open-matrix")).toBe(true);
    expect(active.offers("shortcut", "matrix")).toBe(true);
    expect(active.offers("tool", "set_data_route")).toBe(true);
  });

  it("should turn on a Capability whose data the athlete already has when they never decided", () => {
    // Arrange
    const input = { decisions: {}, withData: new Set(["templates"]) };

    // Act
    const active = resolveCapabilities(input, CATALOGUE);

    // Assert
    expect(active.isOn("templates")).toBe(true);
    expect(active.offers("route", "/library")).toBe(true);
  });

  it("should keep a deactivated Capability off even though its data is still there", () => {
    // Arrange
    const input = {
      decisions: { templates: false },
      withData: new Set(["templates"]),
    };

    // Act
    const active = resolveCapabilities(input, CATALOGUE);

    // Assert
    expect(active.isOn("templates")).toBe(false);
    expect(active.offers("nav", "library")).toBe(false);
  });

  it("should not adopt data for a Capability that does not declare it", () => {
    // Arrange
    const input = { decisions: {}, withData: new Set(["authority-matrix"]) };

    // Act
    const active = resolveCapabilities(input, CATALOGUE);

    // Assert
    expect(active.isOn("authority-matrix")).toBe(false);
  });

  it("should match a route below the owned path but not a path that only shares its prefix", () => {
    // Arrange
    const active = resolveCapabilities(
      { decisions: {}, withData: new Set<string>() },
      CATALOGUE
    );

    // Act
    const below = active.offers("route", "/library/abc");
    const sibling = active.offers("route", "/library-old");

    // Assert
    expect(below).toBe(false);
    expect(sibling).toBe(true);
  });

  it("should offer every surface no Capability owns", () => {
    // Arrange
    const active = resolveCapabilities(
      { decisions: {}, withData: new Set<string>() },
      CATALOGUE
    );

    // Act
    const offered = [
      active.offers("nav", "calendar"),
      active.offers("route", "/daily"),
      active.offers("tool", "get_today"),
    ];

    // Assert
    expect(offered).toEqual([true, true, true]);
  });

  it("should ignore a decision for a Capability the catalogue no longer has", () => {
    // Arrange
    const input = { decisions: { retired: true }, withData: new Set<string>() };

    // Act
    const active = resolveCapabilities(input, CATALOGUE);

    // Assert
    expect(active.isOn("retired")).toBe(false);
    expect(active.on).toEqual([]);
  });
});
