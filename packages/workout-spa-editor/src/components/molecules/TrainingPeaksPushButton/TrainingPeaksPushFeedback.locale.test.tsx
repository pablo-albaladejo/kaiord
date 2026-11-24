import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { TrainingPeaksPushFeedback } from "./TrainingPeaksPushFeedback";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

describe("TrainingPeaksPushFeedback in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should word a refusal with its one fix in Spanish", () => {
    // Arrange
    const failure = { ok: false, reason: "sign-in" } as const;

    // Act
    render(
      <TrainingPeaksPushFeedback
        failure={failure}
        onSendCopy={vi.fn()}
        onSendAnyway={vi.fn()}
      />
    );

    // Assert
    const notice = screen.getByTestId("trainingpeaks-push-error");
    expect(notice).toHaveTextContent(
      "No puedes usar TrainingPeaks en Kaiord hasta que inicies sesión en TrainingPeaks en este navegador."
    );
    expect(screen.getByRole("link")).toHaveTextContent(
      "Iniciar sesión en TrainingPeaks"
    );
  });

  it("should word an unrecognised failure as not answering, with no cause", () => {
    // Arrange
    const failure = { ok: false, reason: "not-answering" } as const;

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
    expect(text).toBe(
      "TrainingPeaks no responde, así que ahora mismo no puedes usar TrainingPeaks en Kaiord."
    );
  });
});
