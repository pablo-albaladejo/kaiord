import { describe, expect, it } from "vitest";

import type { DayEnergyBalance } from "../../domain/schemas/health/energy-balance";
import { aggregateEnergyBalance } from "./aggregate-energy-balance";

const BASAL_KCAL = 1700;
const ACTIVITY_KCAL = 500;
const DEFAULT_EXPENDITURE = 2200;

const A_EXPENDITURE = 2200;
const A_INTAKE = 2000;
const A_NET = -200;

const B_EXPENDITURE = 2400;
const B_INTAKE = 2600;
const B_NET = 200;

const UNTRACKED_EXPENDITURE = 2300;
const SECOND_UNTRACKED_EXPENDITURE = 2100;

const day = (
  overrides: Partial<DayEnergyBalance> & { date: string }
): DayEnergyBalance => ({
  basal_kcal: BASAL_KCAL,
  activity_kcal: ACTIVITY_KCAL,
  expenditure_kcal: DEFAULT_EXPENDITURE,
  intake_kcal: null,
  net_kcal: null,
  target_kcal: null,
  source: "predicted",
  ...overrides,
});

// Tracked day: 2200 burn, 2000 intake => net -200 (deficit).
const TRACKED_A = day({
  date: "2026-06-01",
  expenditure_kcal: A_EXPENDITURE,
  intake_kcal: A_INTAKE,
  net_kcal: A_NET,
});

// Tracked day: 2400 burn, 2600 intake => net +200 (surplus).
const TRACKED_B = day({
  date: "2026-06-02",
  expenditure_kcal: B_EXPENDITURE,
  intake_kcal: B_INTAKE,
  net_kcal: B_NET,
});

// Untracked day: expenditure only, intake/net null.
const UNTRACKED = day({
  date: "2026-06-03",
  expenditure_kcal: UNTRACKED_EXPENDITURE,
  intake_kcal: null,
  net_kcal: null,
});

const TOTAL_EXPENDITURE_AB = A_EXPENDITURE + B_EXPENDITURE;
const TOTAL_INTAKE_AB = A_INTAKE + B_INTAKE;
const TOTAL_NET_AB = A_NET + B_NET;
const TRACKED_COUNT_AB = 2;
const AVG_EXPENDITURE_AB = TOTAL_EXPENDITURE_AB / TRACKED_COUNT_AB;
const AVG_INTAKE_AB = TOTAL_INTAKE_AB / TRACKED_COUNT_AB;

const MIXED_DAY_COUNT = 2;
const TOTAL_EXPENDITURE_MIXED = A_EXPENDITURE + UNTRACKED_EXPENDITURE;
const AVG_EXPENDITURE_MIXED = TOTAL_EXPENDITURE_MIXED / MIXED_DAY_COUNT;

describe("aggregateEnergyBalance (empty)", () => {
  it("should return zeroed totals with a null intake average for no days", () => {
    // Arrange
    const days: DayEnergyBalance[] = [];

    // Act
    const result = aggregateEnergyBalance(days);

    // Assert
    expect(result).toEqual({
      totalExpenditureKcal: 0,
      totalIntakeKcal: 0,
      totalNetKcal: 0,
      avgExpenditureKcal: 0,
      avgIntakeKcal: null,
      daysTracked: 0,
      dayCount: 0,
    });
  });
});

describe("aggregateEnergyBalance (all tracked)", () => {
  it("should sum expenditure across every day", () => {
    // Arrange
    const days = [TRACKED_A, TRACKED_B];

    // Act
    const result = aggregateEnergyBalance(days);

    // Assert
    expect(result.totalExpenditureKcal).toBe(TOTAL_EXPENDITURE_AB);
  });

  it("should sum intake and net across tracked days", () => {
    // Arrange
    const days = [TRACKED_A, TRACKED_B];

    // Act
    const result = aggregateEnergyBalance(days);

    // Assert
    expect(result.totalIntakeKcal).toBe(TOTAL_INTAKE_AB);
    expect(result.totalNetKcal).toBe(TOTAL_NET_AB);
  });

  it("should average expenditure over dayCount and intake over daysTracked", () => {
    // Arrange
    const days = [TRACKED_A, TRACKED_B];

    // Act
    const result = aggregateEnergyBalance(days);

    // Assert
    expect(result.avgExpenditureKcal).toBe(AVG_EXPENDITURE_AB);
    expect(result.avgIntakeKcal).toBe(AVG_INTAKE_AB);
    expect(result.daysTracked).toBe(TRACKED_COUNT_AB);
    expect(result.dayCount).toBe(TRACKED_COUNT_AB);
  });
});

describe("aggregateEnergyBalance (mixed tracked and untracked)", () => {
  it("should count expenditure from an untracked day but exclude it from intake", () => {
    // Arrange
    const days = [TRACKED_A, UNTRACKED];

    // Act
    const result = aggregateEnergyBalance(days);

    // Assert
    expect(result.totalExpenditureKcal).toBe(TOTAL_EXPENDITURE_MIXED);
    expect(result.totalIntakeKcal).toBe(A_INTAKE);
    expect(result.totalNetKcal).toBe(A_NET);
  });

  it("should divide the intake average by tracked days only, never coercing null to zero", () => {
    // Arrange
    const days = [TRACKED_A, UNTRACKED];
    const expectedTracked = 1;

    // Act
    const result = aggregateEnergyBalance(days);

    // Assert
    expect(result.daysTracked).toBe(expectedTracked);
    expect(result.dayCount).toBe(MIXED_DAY_COUNT);
    expect(result.avgIntakeKcal).toBe(A_INTAKE);
  });

  it("should average expenditure over every day including untracked ones", () => {
    // Arrange
    const days = [TRACKED_A, UNTRACKED];

    // Act
    const result = aggregateEnergyBalance(days);

    // Assert
    expect(result.avgExpenditureKcal).toBe(AVG_EXPENDITURE_MIXED);
  });
});

describe("aggregateEnergyBalance (all untracked)", () => {
  it("should report a null intake average when no day is tracked", () => {
    // Arrange
    const days = [
      UNTRACKED,
      day({
        date: "2026-06-04",
        expenditure_kcal: SECOND_UNTRACKED_EXPENDITURE,
      }),
    ];

    // Act
    const result = aggregateEnergyBalance(days);

    // Assert
    expect(result.daysTracked).toBe(0);
    expect(result.totalIntakeKcal).toBe(0);
    expect(result.totalNetKcal).toBe(0);
    expect(result.avgIntakeKcal).toBeNull();
  });
});
