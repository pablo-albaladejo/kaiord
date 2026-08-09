import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Link, Route, Router, useSearch } from "wouter";

import {
  fragmentPath,
  fragmentSearch,
  navigateFragment,
  useFragmentLocation,
} from "./fragment-location";

function setFragment(hash: string): void {
  window.history.replaceState(null, "", hash === "" ? "/" : hash);
}

describe("fragmentPath", () => {
  beforeEach(() => {
    setFragment("");
  });

  it("should read the route from the fragment", () => {
    // Arrange
    setFragment("#/calendar/2026-W32");

    // Act
    const path = fragmentPath();

    // Assert
    expect(path).toBe("/calendar/2026-W32");
  });

  it("should stop at the query string", () => {
    // Arrange
    setFragment("#/workout/new?source=scratch");

    // Act
    const path = fragmentPath();

    // Assert
    expect(path).toBe("/workout/new");
  });

  it("should report the root route for an empty fragment", () => {
    // Arrange
    setFragment("");

    // Act
    const path = fragmentPath();

    // Assert
    expect(path).toBe("/");
  });

  it("should add the leading slash a hand-written fragment may omit", () => {
    // Arrange
    setFragment("#calendar");

    // Act
    const path = fragmentPath();

    // Assert
    expect(path).toBe("/calendar");
  });
});

describe("fragmentSearch", () => {
  it("should return the query string with its question mark", () => {
    // Arrange
    setFragment("#/workout/new?source=scratch&date=2026-06-05");

    // Act
    const search = fragmentSearch();

    // Assert
    expect(search).toBe("?source=scratch&date=2026-06-05");
  });

  it("should return an empty string when the route carries no query", () => {
    // Arrange
    setFragment("#/library");

    // Act
    const search = fragmentSearch();

    // Assert
    expect(search).toBe("");
  });
});

describe("navigateFragment", () => {
  beforeEach(() => {
    setFragment("#/calendar");
  });

  it("should push the new route and notify subscribers", () => {
    // Arrange
    const onHashChange = vi.fn();
    window.addEventListener("hashchange", onHashChange);

    // Act
    navigateFragment("/library");

    // Assert
    expect(window.location.hash).toBe("#/library");
    expect(onHashChange).toHaveBeenCalledTimes(1);
    window.removeEventListener("hashchange", onHashChange);
  });

  it("should replace the entry instead of pushing when asked", () => {
    // Arrange
    const replaceState = vi.spyOn(window.history, "replaceState");
    const pushState = vi.spyOn(window.history, "pushState");

    // Act
    navigateFragment("/library", { replace: true });

    // Assert
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(pushState).not.toHaveBeenCalled();
    replaceState.mockRestore();
    pushState.mockRestore();
  });

  it("should drop a query the target does not restate", () => {
    // Arrange
    // The reason this module exists rather than wouter's own hash hook: there,
    // the query lives outside the fragment and survives the route that set it,
    // so `/daily` would inherit the date from `/workout/new`.
    setFragment("#/workout/new?date=2026-06-05");

    // Act
    navigateFragment("/daily");

    // Assert
    expect(window.location.hash).toBe("#/daily");
    expect(fragmentSearch()).toBe("");
  });

  it("should keep the path out of the request the browser makes", () => {
    // Arrange
    setFragment("#/calendar");

    // Act
    navigateFragment("/workout/6e3ad6f0-1234-4cdf-9abc-1234567890ab");

    // Assert
    // The pathname is what the host is asked for, and it never moves.
    expect(window.location.pathname).toBe("/");
  });
});

describe("useFragmentLocation", () => {
  beforeEach(() => {
    setFragment("#/");
  });

  it("should render the route named by the fragment, query included", () => {
    // Arrange
    setFragment("#/workout/new?source=scratch");
    const Surface = () => (
      <p>source: {new URLSearchParams(useSearch()).get("source")}</p>
    );

    // Act
    render(
      <Router hook={useFragmentLocation}>
        <Route path="/workout/new" component={Surface} />
      </Router>
    );

    // Assert
    expect(screen.getByText("source: scratch")).toBeInTheDocument();
  });

  it("should give links a fragment href so the host is never asked to resolve them", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Router hook={useFragmentLocation}>
        <Link href="/library">go</Link>
        <Route path="/library">arrived</Route>
      </Router>
    );
    const link = screen.getByRole("link", { name: "go" });

    // Act
    const href = link.getAttribute("href");
    await user.click(link);

    // Assert
    expect(href).toBe("#/library");
    expect(screen.getByText("arrived")).toBeInTheDocument();
  });
});
