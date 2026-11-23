import { renderHook } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../i18n/i18n";
import { useCoachingSportLabel } from "./use-coaching-sport-label";

const locale = vi.hoisted(() => ({ active: "en" }));

vi.mock("../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));

const HIKING = { id: "mountainwalk", icon: "\u{1F97E}" };
const FALLBACK = { id: "activity", icon: "\u{1F4AA}" };

describe("useCoachingSportLabel", () => {
  it("should word the sport in English by default", () => {
    // Arrange
    locale.active = "en";

    // Act
    const { result } = renderHook(() =>
      [HIKING, FALLBACK].map((sport) => useCoachingSportLabel(sport))
    );

    // Assert
    expect(result.current).toEqual(["Hiking", "Activity"]);
  });

  describe("in Spanish", () => {
    beforeAll(async () => {
      locale.active = "es";
      await setActiveLocale("es");
    });
    afterAll(() => {
      locale.active = "en";
      void appI18n.changeLanguage("en");
    });

    it("should word the sport and the fallback in Spanish", () => {
      // Arrange
      const sports = [HIKING, FALLBACK];

      // Act
      const { result } = renderHook(() =>
        sports.map((sport) => useCoachingSportLabel(sport))
      );

      // Assert
      expect(result.current).toEqual(["Senderismo", "Actividad"]);
    });
  });
});
