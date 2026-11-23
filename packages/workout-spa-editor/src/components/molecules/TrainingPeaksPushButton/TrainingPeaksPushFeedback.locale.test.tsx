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
    const failure = { ok: false, refusal: "signIn" } as const;

    // Act
    render(
      <TrainingPeaksPushFeedback failure={failure} onSendCopy={vi.fn()} />
    );

    // Assert
    expect(screen.getByTestId("trainingpeaks-push-error")).toHaveTextContent(
      "Inicia sesión en TrainingPeaks y vuelve a intentarlo."
    );
  });

  it("should show an upstream message as is", () => {
    // Arrange
    const failure = { ok: false, message: "HTTP 500" } as const;

    // Act
    render(
      <TrainingPeaksPushFeedback failure={failure} onSendCopy={vi.fn()} />
    );

    // Assert
    expect(screen.getByTestId("trainingpeaks-push-error")).toHaveTextContent(
      "HTTP 500"
    );
  });
});
