import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { PendingActionCard } from "./PendingActionCard";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

vi.mock("../../../hooks/use-workout-label-live", () => ({
  useWorkoutLabelLive: () => ({
    title: "Rodaje con contrastes",
    duration: "45 min",
    date: "2026-10-16",
  }),
}));

const renderCard = (toolName: string, input: unknown) =>
  render(
    <PendingActionCard
      action={{ toolCallId: "c1", toolName, input }}
      onApprove={vi.fn()}
      onDeny={vi.fn()}
      busy={false}
    />
  );

describe("PendingActionCard in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should word a Garmin push with the workout name and the device notice", () => {
    // Arrange
    const input = { workoutId: "w1" };

    // Act
    renderCard("push_to_garmin", input);

    // Assert
    expect(screen.getByText("Confirmar: Enviar a Garmin")).toBeInTheDocument();
    expect(
      screen.getByText("«Rodaje con contrastes» (45 min) el 16 oct")
    ).toBeInTheDocument();
    expect(screen.getByText(/fuera de tu dispositivo/)).toBeInTheDocument();
  });

  it("should word a sleep log with hours and a short date", () => {
    // Arrange
    const input = { metric: "sleep", day: "2026-10-16", value: 7 };

    // Act
    renderCard("log_health_metric", input);

    // Assert
    expect(screen.getByText("Sueño: 7 h el 16 oct")).toBeInTheDocument();
  });

  it("should word an intake with its meal slot", () => {
    // Arrange
    const input = {
      date: "2026-10-16",
      kcal: 400,
      proteinG: 20,
      carbG: 50,
      fatG: 10,
      mealSlot: "dinner",
    };

    // Act
    renderCard("log_intake", input);

    // Assert
    expect(
      screen.getByText(
        "Cena: 400 kcal (proteína 20 g · hidratos 50 g · grasa 10 g) el 16 oct"
      )
    ).toBeInTheDocument();
  });

  it("should name a known sport of a proposed workout in Spanish", () => {
    // Arrange
    const input = {
      description: "Rodaje",
      date: "2026-10-16",
      sport: "running",
    };

    // Act
    renderCard("create_workout", input);

    // Assert
    expect(screen.getByText("Carrera el 16 oct: «Rodaje»")).toBeInTheDocument();
  });
});
