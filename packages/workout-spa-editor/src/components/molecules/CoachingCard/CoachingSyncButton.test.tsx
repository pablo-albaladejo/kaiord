import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CoachingSyncButton } from "./CoachingSyncButton";

const mockMatchMedia = (reduced: boolean) => {
  const listeners = new Set<() => void>();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: reduced && query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: (_type: string, cb: () => void) => listeners.add(cb),
      removeEventListener: (_type: string, cb: () => void) =>
        listeners.delete(cb),
      dispatchEvent: () => true,
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
    }),
  });
};

describe("CoachingSyncButton — not-connected state", () => {
  beforeEach(() => mockMatchMedia(false));
  afterEach(() => vi.restoreAllMocks());

  it("should render connect CTA with the platform label", () => {
    render(
      <CoachingSyncButton
        connected={false}
        loading={false}
        error={null}
        onSync={vi.fn()}
        onConnect={vi.fn()}
        label="Train2Go"
      />
    );

    expect(screen.getByText("Connect to Train2Go")).toBeInTheDocument();
  });

  it("should show error text alongside the connect CTA", () => {
    render(
      <CoachingSyncButton
        connected={false}
        loading={false}
        error="Session expired"
        onSync={vi.fn()}
        onConnect={vi.fn()}
      />
    );

    expect(screen.getByText("Session expired")).toBeInTheDocument();
  });

  it("should invoke onConnect when the CTA is clicked", async () => {
    const onConnect = vi.fn();
    render(
      <CoachingSyncButton
        connected={false}
        loading={false}
        error={null}
        onSync={vi.fn()}
        onConnect={onConnect}
      />
    );

    await userEvent.click(screen.getByText("Connect to Coach"));

    expect(onConnect).toHaveBeenCalledTimes(1);
  });
});

describe("CoachingSyncButton — connected state (icon-only chrome)", () => {
  beforeEach(() => mockMatchMedia(false));
  afterEach(() => vi.restoreAllMocks());

  it("renders an icon-only button with aria-label='Sync <Label>' and no visible text label", () => {
    render(
      <CoachingSyncButton
        connected={true}
        loading={false}
        error={null}
        onSync={vi.fn()}
        onConnect={vi.fn()}
        label="Train2Go"
      />
    );

    const button = screen.getByRole("button", { name: "Sync Train2Go" });
    expect(button).toBeInTheDocument();
    // No visible text — only the icon is rendered.
    expect(screen.queryByText("Sync Train2Go")).toBeNull();
  });

  it("should surface the relative-time tooltip via the title attribute", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    render(
      <CoachingSyncButton
        connected={true}
        loading={false}
        error={null}
        onSync={vi.fn()}
        onConnect={vi.fn()}
        label="Train2Go"
        lastSyncedAt={fiveMinutesAgo}
      />
    );

    const button = screen.getByRole("button", { name: "Sync Train2Go" });
    expect(button.getAttribute("title")).toMatch(/^Train2Go · \d+m ago$/);
  });

  it("surfaces 'never synced' when lastSyncedAt is undefined", () => {
    render(
      <CoachingSyncButton
        connected={true}
        loading={false}
        error={null}
        onSync={vi.fn()}
        onConnect={vi.fn()}
        label="Train2Go"
      />
    );

    const button = screen.getByRole("button", { name: "Sync Train2Go" });
    expect(button.getAttribute("title")).toBe("Train2Go · never synced");
  });

  it("should replace the icon with a spinner in place during sync and disables the button", () => {
    render(
      <CoachingSyncButton
        connected={true}
        loading={true}
        error={null}
        onSync={vi.fn()}
        onConnect={vi.fn()}
        label="Train2Go"
      />
    );

    const button = screen.getByRole("button", { name: "Sync Train2Go" });
    expect(button).toBeDisabled();
    expect(button.getAttribute("title")).toBe("Train2Go · syncing…");
    // Spinner uses the lucide Loader2 icon with the spin animation class.
    const spinner = button.querySelector("svg");
    expect(spinner?.getAttribute("class")).toMatch(/animate-spin/);
  });

  it("should invoke onSync when clicked", async () => {
    const onSync = vi.fn();
    render(
      <CoachingSyncButton
        connected={true}
        loading={false}
        error={null}
        onSync={onSync}
        onConnect={vi.fn()}
        label="Train2Go"
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Sync Train2Go" })
    );

    expect(onSync).toHaveBeenCalledTimes(1);
  });
});

describe("CoachingSyncButton — prefers-reduced-motion", () => {
  beforeEach(() => mockMatchMedia(true));
  afterEach(() => vi.restoreAllMocks());

  it("should collapse the spinner to a static glyph (no animate-spin class)", () => {
    render(
      <CoachingSyncButton
        connected={true}
        loading={true}
        error={null}
        onSync={vi.fn()}
        onConnect={vi.fn()}
        label="Train2Go"
      />
    );

    const button = screen.getByRole("button", { name: "Sync Train2Go" });
    const spinner = button.querySelector("svg");
    expect(spinner?.getAttribute("class")).not.toMatch(/animate-spin/);
    // Tooltip still updates so the canonical signal is preserved.
    expect(button.getAttribute("title")).toBe("Train2Go · syncing…");
  });
});
