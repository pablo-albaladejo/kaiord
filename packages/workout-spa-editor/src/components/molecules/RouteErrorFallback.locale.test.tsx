import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { appI18n, setActiveLocale } from "../../i18n/i18n";
import { RouteErrorFallback } from "./RouteErrorFallback";

vi.mock("../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

describe("RouteErrorFallback in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should show translated copy and never the raw error text", () => {
    // Arrange
    const error = new Error("token=abc123 leaked from a stack");

    // Act
    render(
      <Router hook={memoryLocation({ path: "/test" }).hook}>
        <RouteErrorFallback error={error} onRetry={vi.fn()} />
      </Router>
    );

    // Assert
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Algo ha fallado");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir a Diario" })).toBeVisible();
    expect(alert).not.toHaveTextContent("token=abc123");
  });
});
