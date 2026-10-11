import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { appI18n, setActiveLocale } from "../i18n/i18n";
import { useRouteAnnouncerLabel } from "./use-route-announcer-label";

vi.mock("../i18n/LocaleProvider", () => ({ useActiveLocale: () => "es" }));

const at = (path: string) => {
  const { hook } = memoryLocation({ path });
  return ({ children }: { children: ReactNode }) => (
    <Router hook={hook}>{children}</Router>
  );
};

describe("useRouteAnnouncerLabel in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it.each([
    ["/settings/connections", "Página de ajustes"],
    ["/athlete", "Página de atleta"],
    ["/workout/new", "Nuevo entreno"],
    ["/health", "Página de tendencias"],
  ])("should announce %s as %s", (path, expected) => {
    // Arrange
    const wrapper = at(path);

    // Act
    const { result } = renderHook(() => useRouteAnnouncerLabel(), { wrapper });

    // Assert
    expect(result.current).toBe(expected);
  });
});
