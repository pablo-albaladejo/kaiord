import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { CapabilitiesFixture } from "../contexts/capabilities-context";
import { CapabilityRouteGate } from "./capability-route-gate";

const renderAt = (
  path: string,
  fixture: { on?: readonly string[]; loading?: boolean } = {}
) => {
  const location = memoryLocation({ path, record: true });
  render(
    <CapabilitiesFixture on={fixture.on ?? []} loading={fixture.loading}>
      <Router hook={location.hook}>
        <CapabilityRouteGate>
          <p>page</p>
        </CapabilityRouteGate>
      </Router>
    </CapabilitiesFixture>
  );
  return location;
};

describe("CapabilityRouteGate", () => {
  it("should send a route of an off Capability to the Day", () => {
    // Arrange
    const location = renderAt("/library/abc");

    // Act
    const landed = location.history.at(-1);

    // Assert
    expect(landed).toBe("/daily");
  });

  it("should render a route of a Capability that is on", () => {
    // Arrange
    const location = renderAt("/library", { on: ["templates"] });

    // Act
    const page = screen.getByText("page");

    // Assert
    expect(page).toBeInTheDocument();
    expect(location.history.at(-1)).toBe("/library");
  });

  it("should render a route no Capability owns", () => {
    // Arrange
    const location = renderAt("/calendar/2026-W48");

    // Act
    const page = screen.getByText("page");

    // Assert
    expect(page).toBeInTheDocument();
    expect(location.history.at(-1)).toBe("/calendar/2026-W48");
  });

  it("should wait for the athlete's decisions before redirecting", () => {
    // Arrange
    const location = renderAt("/library", { loading: true });

    // Act
    const page = screen.queryByText("page");

    // Assert
    expect(page).toBeNull();
    expect(location.history.at(-1)).toBe("/library");
  });
});
