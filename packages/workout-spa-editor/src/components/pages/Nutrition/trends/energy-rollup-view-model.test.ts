import { describe, expect, it } from "vitest";

import type { EnergyRollup } from "../../../../application/energy/build-energy-rollup";
import { toEnergyRollupView } from "./energy-rollup-view-model";

const base: EnergyRollup = {
  totalExpenditureKcal: 6900,
  totalIntakeKcal: 6000,
  totalNetKcal: -900,
  avgExpenditureKcal: 2300,
  avgIntakeKcal: 2000,
  daysTracked: 3,
  dayCount: 3,
  startDate: "2026-06-01",
  endDate: "2026-06-03",
  daysInRange: 3,
  daysResolved: 3,
};

describe("toEnergyRollupView", () => {
  it("should label a negative net total as a deficit", () => {
    // Arrange
    const rollup = base;

    // Act
    const vm = toEnergyRollupView(rollup);

    // Assert
    expect(vm.net).toBe("900 kcal deficit");
    expect(vm.netTone).toBe("deficit");
  });

  it("should label a positive net total as a surplus", () => {
    // Arrange
    const rollup: EnergyRollup = { ...base, totalNetKcal: 500 };

    // Act
    const vm = toEnergyRollupView(rollup);

    // Assert
    expect(vm.net).toBe("500 kcal surplus");
    expect(vm.netTone).toBe("surplus");
  });

  it("should report untracked intake without inventing a zero average", () => {
    // Arrange
    const rollup: EnergyRollup = {
      ...base,
      avgIntakeKcal: null,
      daysTracked: 0,
      totalNetKcal: 0,
    };

    // Act
    const vm = toEnergyRollupView(rollup);

    // Assert
    expect(vm.avgIntake).toBe("Untracked");
    expect(vm.net).toBe("—");
    expect(vm.netTone).toBe("unknown");
  });

  it("should summarise the tracked-vs-range coverage", () => {
    // Arrange
    const rollup: EnergyRollup = { ...base, daysTracked: 2, daysInRange: 5 };

    // Act
    const vm = toEnergyRollupView(rollup);

    // Assert
    expect(vm.daysTracked).toBe("2/5 days tracked");
  });
});
