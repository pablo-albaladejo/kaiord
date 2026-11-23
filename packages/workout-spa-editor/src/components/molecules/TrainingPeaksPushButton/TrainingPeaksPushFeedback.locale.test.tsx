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
      <TrainingPeaksPushFeedback failure={failure} onSendCopy={vi.fn()} />
    );

    // Assert
    expect(screen.getByTestId("trainingpeaks-push-error")).toHaveTextContent(
      "Inicia sesión en TrainingPeaks y vuelve a intentarlo."
    );
  });

  it("should word an unrecognised failure as not answering, with no cause", () => {
    // Arrange
    const failure = { ok: false, reason: "not-answering" } as const;

    // Act
    render(
      <TrainingPeaksPushFeedback failure={failure} onSendCopy={vi.fn()} />
    );

    // Assert
    const text = screen.getByTestId("trainingpeaks-push-error").textContent;
    expect(text).toMatch(/TrainingPeaks no responde/);
    expect(text).toMatch(/Inténtalo de nuevo/);
  });
});
