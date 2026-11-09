import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { ExecutedWorkoutsSection } from "./ExecutedWorkoutsSection";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

const EXECUTED = {
  id: "exec-1",
  date: "2026-04-13",
  sport: "cycling",
  state: "raw",
  raw: { title: "", duration: { value: 3600, unit: "s" } },
} as unknown as WorkoutRecord;

describe("ExecutedWorkoutsSection in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should translate the heading, sport and untitled fallback", () => {
    // Arrange
    const onOpenExecuted = vi.fn();

    // Act
    render(
      <ExecutedWorkoutsSection
        executed={[EXECUTED]}
        onOpenExecuted={onOpenExecuted}
      />
    );

    // Assert
    const section = screen.getByTestId("executed-workouts-section");
    expect(section).toHaveTextContent("Actividades completadas");
    expect(section).toHaveTextContent("Entreno sin título");
    expect(section).toHaveTextContent("Ciclismo");
  });
});
