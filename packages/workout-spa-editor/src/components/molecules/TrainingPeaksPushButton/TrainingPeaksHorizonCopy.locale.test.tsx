import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { TrainingPeaksHorizonNotice } from "./TrainingPeaksHorizonNotice";
import { TrainingPeaksPushFeedback } from "./TrainingPeaksPushFeedback";

const locale = vi.hoisted(() => ({ active: "en" }));

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));

// 09:00 in Madrid: an account at UTC-12 is still on 2026-11-22, so the
// browser's tomorrow (2026-11-24) is already "after tomorrow" there.
const MORNING_IN_MADRID = new Date("2026-11-23T08:00:00Z");
const BROWSER_TOMORROW = "2026-11-24";

const COPY = {
  en: {
    notice:
      "A Basic TrainingPeaks account accepts only today and tomorrow, counted in the account's time zone, so TrainingPeaks may refuse this day.",
    refused:
      "TrainingPeaks refused this day, so the workout was not sent: a Basic account accepts only today and tomorrow, counted in the TrainingPeaks account's time zone.",
  },
  es: {
    notice:
      "Una cuenta Basic de TrainingPeaks solo acepta hoy y mañana, contados en la zona horaria de la cuenta, así que TrainingPeaks puede rechazar este día.",
    refused:
      "TrainingPeaks ha rechazado este día, así que el entreno no se ha enviado: una cuenta Basic solo acepta hoy y mañana, contados en la zona horaria de la cuenta de TrainingPeaks.",
  },
} as const;

describe.each(["en", "es"] as const)(
  "TrainingPeaks horizon copy in %s",
  (lang) => {
    beforeEach(async () => {
      locale.active = lang;
      await setActiveLocale(lang);
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(MORNING_IN_MADRID);
    });

    afterEach(() => {
      vi.useRealTimers();
      void appI18n.changeLanguage("en");
    });

    it("should warn for the browser's tomorrow when the account's zone may still be on yesterday", () => {
      // Arrange
      const date = BROWSER_TOMORROW;

      // Act
      render(<TrainingPeaksHorizonNotice date={date} />);

      // Assert
      expect(
        screen.getByTestId("trainingpeaks-horizon-notice")
      ).toHaveTextContent(COPY[lang].notice);
    });

    it("should name the consequence and the account's time zone when TrainingPeaks refuses the day", () => {
      // Arrange
      const failure = { ok: false, reason: "horizon" } as const;

      // Act
      render(
        <TrainingPeaksPushFeedback
          failure={failure}
          onSendCopy={vi.fn()}
          onSendAnyway={vi.fn()}
        />
      );

      // Assert
      const text = screen.getByTestId("trainingpeaks-push-error").textContent;
      expect(text).toBe(COPY[lang].refused);
      expect(text).not.toMatch(/Schedule|Programa/);
    });
  }
);
