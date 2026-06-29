import { describe, expect, it } from "vitest";

import type { MacroNutrients } from "../../domain/schemas/health/nutrition";
import {
  assembleDayEnergyBalance,
  type AssembleDayEnergyBalanceInput,
  type ResolvedExpenditure,
} from "./day-balance";

const DATE = "2026-06-21";

const PREDICTED: ResolvedExpenditure = {
  basalKcal: 1750,
  activityKcal: 450,
  expenditureKcal: 2200,
  source: "predicted",
};

const MEASURED: ResolvedExpenditure = {
  basalKcal: 1700,
  activityKcal: 600,
  expenditureKcal: 2300,
  source: "measured",
};

const MACRO_TARGETS: MacroNutrients = {
  kcal: 2000,
  protein_g: 150,
  carb_g: 200,
  fat_g: 60,
};

const MACRO_ACTUALS: MacroNutrients = {
  kcal: 1800,
  protein_g: 130,
  carb_g: 190,
  fat_g: 55,
};

const INTAKE_BELOW = 1800;
const INTAKE_ABOVE = 2500;
const TARGET_KCAL = 2000;

// Spec "Day in deficit": 3000 burn, 2400 intake => net_kcal = -600.
const SPEC_EXPENDITURE = 3000;
const SPEC_INTAKE = 2400;
const SPEC_NET = SPEC_INTAKE - SPEC_EXPENDITURE;

const baseInput = (
  overrides: Partial<AssembleDayEnergyBalanceInput>
): AssembleDayEnergyBalanceInput => ({
  date: DATE,
  expenditure: PREDICTED,
  intakeKcal: null,
  targetKcal: null,
  ...overrides,
});

describe("assembleDayEnergyBalance (untracked intake)", () => {
  it("should leave net_kcal null when intake is untracked", () => {
    // Arrange
    const input = baseInput({ intakeKcal: null });

    // Act
    const result = assembleDayEnergyBalance(input);

    // Assert
    expect(result.intake_kcal).toBeNull();
    expect(result.net_kcal).toBeNull();
  });

  it("should pass through expenditure fields and source for an untracked day", () => {
    // Arrange
    const input = baseInput({ expenditure: MEASURED });

    // Act
    const result = assembleDayEnergyBalance(input);

    // Assert
    expect(result.basal_kcal).toBe(MEASURED.basalKcal);
    expect(result.activity_kcal).toBe(MEASURED.activityKcal);
    expect(result.expenditure_kcal).toBe(MEASURED.expenditureKcal);
    expect(result.source).toBe("measured");
  });
});

describe("assembleDayEnergyBalance (tracked intake)", () => {
  it.each([
    // deficit / surplus / balanced / spec "Day in deficit" (3000 burn, 2400 intake)
    [
      INTAKE_BELOW,
      PREDICTED.expenditureKcal,
      INTAKE_BELOW - PREDICTED.expenditureKcal,
    ],
    [
      INTAKE_ABOVE,
      PREDICTED.expenditureKcal,
      INTAKE_ABOVE - PREDICTED.expenditureKcal,
    ],
    [PREDICTED.expenditureKcal, PREDICTED.expenditureKcal, 0],
    [SPEC_INTAKE, SPEC_EXPENDITURE, SPEC_NET],
  ])(
    "should report net_kcal %i - %i = %i for tracked intake",
    (intakeKcal, expenditureKcal, expectedNet) => {
      // Arrange
      const input = baseInput({
        expenditure: { ...PREDICTED, expenditureKcal },
        intakeKcal,
      });

      // Act
      const result = assembleDayEnergyBalance(input);

      // Assert
      expect(result.intake_kcal).toBe(intakeKcal);
      expect(result.net_kcal).toBe(expectedNet);
    }
  );
});

describe("assembleDayEnergyBalance (targets and macros)", () => {
  it("should pass through target_kcal when a goal is active", () => {
    // Arrange
    const input = baseInput({
      intakeKcal: INTAKE_BELOW,
      targetKcal: TARGET_KCAL,
    });

    // Act
    const result = assembleDayEnergyBalance(input);

    // Assert
    expect(result.target_kcal).toBe(TARGET_KCAL);
  });

  it("should omit macro fields when not provided", () => {
    // Arrange
    const input = baseInput({
      intakeKcal: INTAKE_BELOW,
      targetKcal: TARGET_KCAL,
    });

    // Act
    const result = assembleDayEnergyBalance(input);

    // Assert
    expect(result.macro_targets).toBeUndefined();
    expect(result.macro_actuals).toBeUndefined();
  });

  it("should pass through macro targets and actuals when provided", () => {
    // Arrange
    const input = baseInput({
      intakeKcal: INTAKE_BELOW,
      targetKcal: TARGET_KCAL,
      macroTargets: MACRO_TARGETS,
      macroActuals: MACRO_ACTUALS,
    });

    // Act
    const result = assembleDayEnergyBalance(input);

    // Assert
    expect(result.macro_targets).toEqual(MACRO_TARGETS);
    expect(result.macro_actuals).toEqual(MACRO_ACTUALS);
  });
});

describe("assembleDayEnergyBalance (validation)", () => {
  it("should throw when expenditure kcal is negative", () => {
    // Arrange
    const input = baseInput({
      expenditure: { ...PREDICTED, expenditureKcal: -1 },
    });

    // Act
    const act = () => assembleDayEnergyBalance(input);

    // Assert
    expect(act).toThrow();
  });

  it("should throw for a malformed date", () => {
    // Arrange
    const input = baseInput({ date: "21-06-2026" });

    // Act
    const act = () => assembleDayEnergyBalance(input);

    // Assert
    expect(act).toThrow();
  });
});
