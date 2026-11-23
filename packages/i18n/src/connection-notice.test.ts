import { describe, expect, it } from "vitest";

import {
  CONNECTION_FIXES,
  connectionFix,
  connectionNoTabNotice,
  connectionNotCheckedText,
  connectionNotice,
  connectionReasonNotice,
  type ConnectionState,
} from "./connection-notice";
import notices from "./generated/connection-notices.js";
import { type Locale, SUPPORTED_LOCALES } from "./types";

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
            "TrainingPeaks no responde, así que ahora mismo no puedes usar TrainingPeaks en Kaiord.",
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

describe("the notices beyond the four fixes", () => {
  it.each(SUPPORTED_LOCALES)(
    "should word a WHOOP sign-in with no account id as the popup does, in %s",
    (locale) => {
      // Arrange
      const reason = "no-account-id" as const;

      // Act
      const notice = connectionReasonNotice(reason, "WHOOP", locale);

      // Assert
      expect(notice).toEqual(
        notices.noticeForReason("no-account-id", "WHOOP", locale)
      );
      expect(notice.fix).toBe("sign-in");
    }
  );

  it.each([
    ["would-mint-token", "Garmin"],
    ["no-token-captured", "WHOOP"],
  ] as const)(
    "should word why a %s check asked %s nothing, in English and Spanish",
    (reason, platform) => {
      // Arrange
      const locales = ["en", "es"] as const;

      // Act
      const texts = locales.map((l) =>
        connectionNotCheckedText(reason, platform, l)
      );

      // Assert
      expect(texts).toEqual(
        locales.map((l) => notices.notCheckedFor(reason, platform, l))
      );
      expect(texts.every((t) => t.includes(platform))).toBe(true);
    }
  );

  it("should word the one exception, opening the Platform's tab, as the popup does", () => {
    // Arrange
    const platform = "WHOOP";

    // Act
    const notice = connectionNoTabNotice(platform, "en");

    // Assert
    expect(notice).toEqual(notices.noTabNotice(platform, "en"));
    expect(notice.fix).toBe("open-platform");
  });

  it("should word the no-tab reason as the one exception, opening the Platform's tab", () => {
    // Arrange
    const platform = "WHOOP";

    // Act
    const notice = connectionReasonNotice("no-tab", platform, "es");

    // Assert
    expect(notice).toEqual(connectionNoTabNotice(platform, "es"));
    expect(notice.fix).toBe("open-platform");
  });

  it("should give no notice for a reason the shared notices do not know", () => {
    // Arrange
    const unknown = "token-expired" as "no-account-id";

    // Act
    const notice = notices.noticeForReason(unknown, "WHOOP", "en");

    // Assert
    expect(notice).toBeNull();
  });

  it("should give no text for a not-checked reason the shared notices do not know", () => {
    // Arrange
    const unknown = "token-expired" as "would-mint-token";

    // Act
    const text = notices.notCheckedFor(unknown, "Garmin", "en");

    // Assert
    expect(text).toBeNull();
  });
});

describe("a locale the shared notices do not word", () => {
  const unknown = "fr" as Locale;

  it("should word the four fixes in English", () => {
    // Arrange
    const state = "signed-out" as const;

    // Act
    const notice = connectionNotice(state, "Garmin", unknown);

    // Assert
    expect(notice).toEqual(connectionNotice(state, "Garmin", "en"));
  });

  it("should word the notices beyond the four fixes in English", () => {
    // Arrange
    const platform = "WHOOP";

    // Act
    const words = [
      connectionReasonNotice("no-account-id", platform, unknown),
      connectionNotCheckedText("would-download-data", platform, unknown),
      connectionNoTabNotice(platform, unknown),
    ];

    // Assert
    expect(words).toEqual([
      connectionReasonNotice("no-account-id", platform, "en"),
      connectionNotCheckedText("would-download-data", platform, "en"),
      connectionNoTabNotice(platform, "en"),
    ]);
  });
});
