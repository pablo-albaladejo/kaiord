import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "../../utils/logger";
import { SilentErrorBoundary } from "./SilentErrorBoundary";

function Boom(): never {
  throw new Error("lazy import failed");
}

describe("SilentErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let loggerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    loggerSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    loggerSpy.mockRestore();
  });

  it("should render nothing in place of a child that throws and keep its siblings", () => {
    // Arrange
    const ui = (
      <div>
        <p>still here</p>
        <SilentErrorBoundary name="shortcuts">
          <Boom />
        </SilentErrorBoundary>
      </div>
    );

    // Act
    render(ui);

    // Assert
    expect(screen.getByText("still here")).toBeInTheDocument();
  });

  it("should log the failure once", () => {
    // Arrange
    const ui = (
      <SilentErrorBoundary name="shortcuts">
        <Boom />
      </SilentErrorBoundary>
    );

    // Act
    const { rerender } = render(ui);
    rerender(ui);

    // Assert
    expect(loggerSpy).toHaveBeenCalledTimes(1);
  });

  it("should render its children when nothing throws", () => {
    // Arrange
    const ui = (
      <SilentErrorBoundary name="shortcuts">
        <p>child</p>
      </SilentErrorBoundary>
    );

    // Act
    render(ui);

    // Assert
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});
