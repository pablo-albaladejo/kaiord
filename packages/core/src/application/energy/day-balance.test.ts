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
  it("should report a negative net (deficit) when intake is below expenditure", () => {
    // Arrange
    const input = baseInput({ intakeKcal: INTAKE_BELOW });

    // Act
    const result = assembleDayEnergyBalance(input);

    // Assert
    expect(result.intake_kcal).toBe(INTAKE_BELOW);
    expect(result.net_kcal).toBe(INTAKE_BELOW - PREDICTED.expenditureKcal);
    expect(result.net_kcal).toBeLessThan(0);
  });

  it("should report a positive net (surplus) when intake exceeds expenditure", () => {
    // Arrange
    const input = baseInput({ intakeKcal: INTAKE_ABOVE });

    // Act
    const result = assembleDayEnergyBalance(input);

    // Assert
    expect(result.net_kcal).toBe(INTAKE_ABOVE - PREDICTED.expenditureKcal);
    expect(result.net_kcal).toBeGreaterThan(0);
  });

  it("should report a zero net when intake equals expenditure", () => {
    // Arrange
    const input = baseInput({ intakeKcal: PREDICTED.expenditureKcal });

    // Act
    const result = assembleDayEnergyBalance(input);

    // Assert
    expect(result.net_kcal).toBe(0);
  });

  it("should match the spec deficit example (3000 burn, 2400 intake) with net -600", () => {
    // Arrange
    const input = baseInput({
      expenditure: { ...PREDICTED, expenditureKcal: SPEC_EXPENDITURE },
      intakeKcal: SPEC_INTAKE,
    });

    // Act
    const result = assembleDayEnergyBalance(input);

    // Assert
    expect(result.net_kcal).toBe(SPEC_NET);
  });
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
