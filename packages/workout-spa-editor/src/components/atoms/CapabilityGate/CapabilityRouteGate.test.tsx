import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Route, Router, Switch } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { CapabilitiesFixture } from "../../../contexts/capabilities-context";
import type { CapabilityId } from "../../../lib/capabilities/capability-catalogue";
import {
  navigateFragment,
  useFragmentLocation,
} from "../../../lib/fragment-location";
import { CapabilityRouteGate } from "./CapabilityRouteGate";

const renderAt = (
  path: string,
  fixture: { on?: readonly CapabilityId[]; loading?: boolean } = {}
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

  it.each(["/Library", "/LIBRARY/abc", "/library/", "/%6Cibrary"])(
    "should never show the Library at %s while Templates is off",
    (path) => {
      // Arrange
      const location = memoryLocation({ path, record: true });

      // Act
      render(
        <CapabilitiesFixture on={[]}>
          <Router hook={location.hook}>
            <CapabilityRouteGate>
              <Switch>
                <Route path="/library">library</Route>
                <Route>other</Route>
              </Switch>
            </CapabilityRouteGate>
          </Router>
        </CapabilitiesFixture>
      );

      // Assert
      expect(screen.queryByText("library")).toBeNull();
      expect(location.history.at(-1)).toBe("/daily");
    }
  );

  it("should send the browser's back into a Library page that was turned off to the Day", async () => {
    // Arrange
    window.history.replaceState(null, "", "#/daily");
    const app = (on: readonly CapabilityId[]) => (
      <CapabilitiesFixture on={on}>
        <Router hook={useFragmentLocation}>
          <CapabilityRouteGate>
            <Switch>
              <Route path="/library">library</Route>
              <Route>other</Route>
            </Switch>
          </CapabilityRouteGate>
        </Router>
      </CapabilitiesFixture>
    );
    const view = render(app(["templates"]));
    act(() => navigateFragment("/library"));
    expect(screen.getByText("library")).toBeInTheDocument();
    act(() => navigateFragment("/daily"));
    view.rerender(app([]));
    const seen: string[] = [];
    const record = () => seen.push(window.location.hash);
    window.addEventListener("hashchange", record);

    // Act
    act(() => window.history.back());

    // Assert
    await waitFor(() => expect(seen).toEqual(["#/library", "#/daily"]));
    window.removeEventListener("hashchange", record);
    expect(window.location.hash).toBe("#/daily");
    expect(screen.queryByText("library")).toBeNull();
    expect(screen.getByText("other")).toBeInTheDocument();
  });
});
