import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { FirstRunGuide } from "./FirstRunGuide";

const PHONE_WIDTH = 390;
const DESKTOP_WIDTH = 1366;

const renderAt = (width: number) => {
  vi.stubGlobal("innerWidth", width);
  const { hook } = memoryLocation({ path: "/calendar" });
  return render(
    <Router hook={hook}>
      <FirstRunGuide weekId="2026-W41" onLogWellness={vi.fn()} />
    </Router>
  );
};

describe("FirstRunGuide on a phone", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("should fold the optional integrations away so the week stays near the top", () => {
    // Arrange

    // Act
    renderAt(PHONE_WIDTH);

    // Assert
    expect(screen.getByTestId("first-run-optional")).not.toHaveAttribute(
      "open"
    );
    expect(screen.getByTestId("first-run-add-workout")).toBeVisible();
  });

  it("should keep the optional integrations open on a wide screen", () => {
    // Arrange

    // Act
    renderAt(DESKTOP_WIDTH);

    // Assert
    expect(screen.getByTestId("first-run-optional")).toHaveAttribute("open");
  });
});
