import { describe, expect, it } from "vitest";

import type { KRD } from "../../../types/krd";
import { generateWorkoutFilename } from "./workout-filename";

const named = (name: string): KRD =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2026-10-11T00:00:00Z", sport: "running" },
    extensions: { structured_workout: { name } },
  }) as KRD;

describe("generateWorkoutFilename", () => {
  it("should transliterate accented letters instead of replacing them", () => {
    // Arrange
    const workout = named("Rodaje prueba auditoría");

    // Act
    const filename = generateWorkoutFilename(workout, "fit");

    // Assert
    expect(filename).toBe("rodaje_prueba_auditoria.fit");
  });

  it("should keep ñ and ü as their base letters", () => {
    // Arrange
    const workout = named("Señal pingüino");

    // Act
    const filename = generateWorkoutFilename(workout, "tcx");

    // Assert
    expect(filename).toBe("senal_pinguino.tcx");
  });

  it("should fall back to workout when nothing printable is left", () => {
    // Arrange
    const workout = named("¡¿!?");

    // Act
    const filename = generateWorkoutFilename(workout, "zwo");

    // Assert
    expect(filename).toBe("workout.zwo");
  });
});
