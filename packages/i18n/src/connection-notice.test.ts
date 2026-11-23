import { describe, expect, it } from "vitest";

import {
  CONNECTION_FIXES,
  connectionFix,
  type ConnectionState,
  connectionNotice,
} from "./connection-notice";
import { SUPPORTED_LOCALES } from "./types";

const STATES: readonly ConnectionState[] = [
  "working",
  "checking",
  "not-installed",
  "outdated",
  "signed-out",
  "not-answering",
];

describe("connectionNotice", () => {
  it("should offer exactly the four fixes", () => {
    // Arrange
    const expected = ["install", "update", "sign-in", "try-again"];

    // Act
    const fixes = [...CONNECTION_FIXES];

    // Assert
    expect(fixes).toEqual(expected);
  });

  it.each([
    ["not-installed", "install"],
    ["outdated", "update"],
    ["signed-out", "sign-in"],
    ["not-answering", "try-again"],
  ] as const)("should map %s to the %s fix", (state, fix) => {
    // Arrange
    const platform = "Garmin";

    // Act
    const notice = connectionNotice(state, platform, "en");

    // Assert
    expect(notice?.fix).toBe(fix);
    expect(connectionFix(state)).toBe(fix);
  });

  it.each(["working", "checking"] as const)(
    "should show no notice while the Connection is %s",
    (state) => {
      // Arrange
      const platform = "Train2Go";

      // Act
      const notice = connectionNotice(state, platform, "es");

      // Assert
      expect(notice).toBeNull();
    }
  );

  it("should fall back to try-again for a state it does not know", () => {
    // Arrange
    const unknown = "token-expired" as ConnectionState;

    // Act
    const notice = connectionNotice(unknown, "WHOOP", "en");

    // Assert
    expect(notice).toEqual({
      fix: "try-again",
      message:
        "WHOOP is not answering, so you cannot use it in Kaiord right now.",
      action: "Try again",
    });
  });

  it("should word the four notices in English and Spanish", () => {
    // Arrange
    const platform = "TrainingPeaks";

    // Act
    const words = SUPPORTED_LOCALES.map((locale) =>
      STATES.map((state) => connectionNotice(state, platform, locale))
    );

    // Assert
    expect(words).toEqual([
      [
        null,
        null,
        {
          fix: "install",
          message:
            "You cannot use TrainingPeaks in Kaiord until Kaiord for TrainingPeaks is installed in this browser.",
          action: "Install Kaiord for TrainingPeaks",
        },
        {
          fix: "update",
          message:
            "You cannot use TrainingPeaks in Kaiord until Kaiord for TrainingPeaks is updated.",
          action: "Update Kaiord for TrainingPeaks",
        },
        {
          fix: "sign-in",
          message:
            "You cannot use TrainingPeaks in Kaiord until you sign in to TrainingPeaks in this browser.",
          action: "Sign in to TrainingPeaks",
        },
        {
          fix: "try-again",
          message:
            "TrainingPeaks is not answering, so you cannot use it in Kaiord right now.",
          action: "Try again",
        },
      ],
      [
        null,
        null,
        {
          fix: "install",
          message:
            "No puedes usar TrainingPeaks en Kaiord hasta que instales Kaiord for TrainingPeaks en este navegador.",
          action: "Instalar Kaiord for TrainingPeaks",
        },
        {
          fix: "update",
          message:
            "No puedes usar TrainingPeaks en Kaiord hasta que actualices Kaiord for TrainingPeaks.",
          action: "Actualizar Kaiord for TrainingPeaks",
        },
        {
          fix: "sign-in",
          message:
            "No puedes usar TrainingPeaks en Kaiord hasta que inicies sesión en TrainingPeaks en este navegador.",
          action: "Iniciar sesión en TrainingPeaks",
        },
        {
          fix: "try-again",
          message:
            "TrainingPeaks no responde, así que ahora mismo no puedes usarlo en Kaiord.",
          action: "Reintentar",
        },
      ],
    ]);
  });

  it("should never tell the athlete they are signed out", () => {
    // Arrange
    const platform = "Garmin";

    // Act
    const text = SUPPORTED_LOCALES.flatMap((locale) =>
      STATES.map((state) => connectionNotice(state, platform, locale))
    )
      .map((notice) => `${notice?.message ?? ""} ${notice?.action ?? ""}`)
      .join(" ");

    // Assert
    expect(text).not.toMatch(/signed out|sesión cerrada|bridge|extension/i);
  });
});
