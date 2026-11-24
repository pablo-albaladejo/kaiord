/**
 * After a send that got no answer, what the athlete reads in English and
 * Spanish: the consequence (it may already be on TrainingPeaks, or Kaiord
 * could not check) on the day that send went to, and one choice, "Send
 * anyway", which sends without reading again.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { TrainingPeaksPushFeedback } from "./TrainingPeaksPushFeedback";

const locale = vi.hoisted(() => ({ active: "en" }));
vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));

const COPY = {
  en: {
    mayBeThere:
      "This workout may already be on TrainingPeaks on Tue, Nov 24: your last send got no answer, and that day holds a workout with this title. Sending it again can add a second copy.",
    unchecked:
      "Kaiord could not check whether this workout is already on TrainingPeaks on Tue, Nov 24, where your last send got no answer. Sending it again can add a second copy.",
    sendAnyway: "Send anyway",
  },
  es: {
    mayBeThere:
      "Puede que este entrenamiento ya esté en TrainingPeaks el mar, 24 nov: tu último envío no recibió respuesta, y ese día tiene un entrenamiento con este título. Enviarlo de nuevo puede añadir una segunda copia.",
    unchecked:
      "Kaiord no ha podido comprobar si este entrenamiento ya está en TrainingPeaks el mar, 24 nov, donde tu último envío no recibió respuesta. Enviarlo de nuevo puede añadir una segunda copia.",
    sendAnyway: "Enviar de todos modos",
  },
} as const;

const blocked = (reason: "may-be-there" | "unchecked") =>
  ({
    ok: false,
    block: { blocked: true, reason, date: "2026-11-24" },
  }) as const;

describe.each(["en", "es"] as const)(
  "after an unanswered send, in %s",
  (lang) => {
    beforeEach(async () => {
      locale.active = lang;
      await setActiveLocale(lang);
    });
    afterEach(() => {
      void appI18n.changeLanguage("en");
    });

    it.each([
      ["may-be-there", "mayBeThere"],
      ["unchecked", "unchecked"],
    ] as const)(
      "should name the consequence for %s with one choice",
      (reason, key) => {
        // Arrange
        const failure = blocked(reason);

        // Act
        render(
          <TrainingPeaksPushFeedback
            failure={failure}
            onSendCopy={vi.fn()}
            onSendAnyway={vi.fn()}
          />
        );

        // Assert
        expect(screen.getByTestId("trainingpeaks-unanswered").textContent).toBe(
          COPY[lang][key]
        );
        expect(screen.getAllByRole("button")).toHaveLength(1);
        expect(screen.getByRole("button")).toHaveTextContent(
          COPY[lang].sendAnyway
        );
      }
    );

    it("should send anyway at once when the athlete chooses it", async () => {
      // Arrange
      const onSendAnyway = vi.fn();
      const onSendCopy = vi.fn();
      render(
        <TrainingPeaksPushFeedback
          failure={blocked("may-be-there")}
          onSendCopy={onSendCopy}
          onSendAnyway={onSendAnyway}
        />
      );

      // Act
      await userEvent.click(
        screen.getByRole("button", { name: COPY[lang].sendAnyway })
      );

      // Assert
      expect(onSendAnyway).toHaveBeenCalledTimes(1);
      expect(onSendCopy).not.toHaveBeenCalled();
    });
  }
);
