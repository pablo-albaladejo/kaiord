import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LazyZonesConflictDialog } from "./LazyZonesConflictDialog";

vi.mock("./ZonesConflictDialog", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

describe("LazyZonesConflictDialog with a failed import", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("should not unmount what surrounds it", async () => {
    // Arrange
    const ui = (
      <main>
        <p>app</p>
        <LazyZonesConflictDialog
          open
          conflicts={[]}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      </main>
    );

    // Act
    render(ui);
    await act(async () => {
      await import("./ZonesConflictDialog").catch(() => undefined);
    });

    // Assert
    expect(screen.getByText("app")).toBeInTheDocument();
  });
});
