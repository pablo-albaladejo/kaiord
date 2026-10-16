import { act } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import App from "./App";
import { renderWithProviders, screen } from "./test-utils";

// The shortcuts chunk failing to load (a stale chunk whose reload is held
// back) must cost the shortcuts only, never the app around them.
vi.mock("./components/AppKeyboardShortcuts", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

const COLD_IMPORT_TIMEOUT_MS = 30_000;

describe("App with a failed shortcuts import", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    await import("./components/pages/CalendarPage");
  }, COLD_IMPORT_TIMEOUT_MS);

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("should keep the app mounted", async () => {
    // Arrange
    renderWithProviders(<App />);

    // Act
    await act(async () => {
      await import("./components/AppKeyboardShortcuts").catch(() => undefined);
    });

    // Assert
    expect(await screen.findByTestId("calendar-page")).toBeInTheDocument();
  });
});
