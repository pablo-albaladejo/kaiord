import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { LegacyTodayRedirect } from "./legacy-today-redirect";

function renderAt(path: string) {
  const { hook, history } = memoryLocation({ path, record: true });
  render(
    <Router hook={hook}>
      <LegacyTodayRedirect />
    </Router>
  );
  return history;
}

describe("LegacyTodayRedirect", () => {
  it("should redirect bare /today to /daily", () => {
    // Arrange

    // Act
    const history = renderAt("/today");

    // Assert
    expect(history.at(-1)).toBe("/daily");
  });

  it("should preserve the ?date= query when redirecting", () => {
    // Arrange

    // Act
    const history = renderAt("/today?date=2026-06-05");

    // Assert
    expect(history.at(-1)).toBe("/daily?date=2026-06-05");
  });
});
