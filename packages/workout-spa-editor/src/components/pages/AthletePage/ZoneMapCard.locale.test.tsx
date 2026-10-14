import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { profileWith } from "../../../lib/athlete/test-profile";
import { ZoneMapCard } from "./ZoneMapCard";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

const LTHR = 168;

describe("ZoneMapCard reason in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should name the threshold and its unit in Spanish", () => {
    // Arrange
    const profile = profileWith("cycling", { lthr: LTHR });
    const { hook } = memoryLocation({ path: "/athlete" });

    // Act
    render(
      <Router hook={hook}>
        <ZoneMapCard profile={profile} sport="cycling" sportLabel="Ciclismo" />
      </Router>
    );

    // Assert
    const reason = screen.getByText(/^Derivadas de/);
    expect(reason).toHaveTextContent("FC umbral 168 ppm");
    expect(reason).not.toHaveTextContent(/Threshold HR|bpm/);
  });
});
