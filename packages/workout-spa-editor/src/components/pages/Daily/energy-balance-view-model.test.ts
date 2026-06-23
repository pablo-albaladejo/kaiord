import type { DayEnergyBalance } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { DayEnergyGoalContext } from "../../../application/energy/day-energy-balance-result";
import { toEnergyBalanceViewModel } from "./energy-balance-view-model";

const goalContext = (
  over: Partial<DayEnergyGoalContext>
): DayEnergyGoalContext => ({
  goalType: "fat_loss",
  dailyDeltaKcal: -400,
  capped: false,
  capReason: null,
  overridden: false,
  maintenanceKcal: 2300,
  maintenanceIsEstimate: false,
  ...over,
});

const baseBalance: DayEnergyBalance = {
  date: "2026-06-21",
  basal_kcal: 1700,
  activity_kcal: 600,
  expenditure_kcal: 2300,
  intake_kcal: 1700,
  net_kcal: -600,
  target_kcal: null,
  source: "measured",
};

describe("toEnergyBalanceViewModel", () => {
  it("should format a measured deficit day", () => {
    // Arrange
    const balance = baseBalance;

    // Act
    const vm = toEnergyBalanceViewModel(balance);

    // Assert
    expect(vm.expenditureLabel).toBe("Measured");
    expect(vm.net).toBe("600 kcal deficit");
    expect(vm.netTone).toBe("deficit");
  });

  it("should report untracked intake and unknown net tone", () => {
    // Arrange
    const balance: DayEnergyBalance = {
      ...baseBalance,
      intake_kcal: null,
      net_kcal: null,
    };

    // Act
    const vm = toEnergyBalanceViewModel(balance);

    // Assert
    expect(vm.intake).toBe("Untracked");
    expect(vm.net).toBe("—");
    expect(vm.netTone).toBe("unknown");
  });

  it("should label a surplus when intake exceeds expenditure", () => {
    // Arrange
    const balance: DayEnergyBalance = {
      ...baseBalance,
      intake_kcal: 2800,
      net_kcal: 500,
    };

    // Act
    const vm = toEnergyBalanceViewModel(balance);

    // Assert
    expect(vm.net).toBe("500 kcal surplus");
    expect(vm.netTone).toBe("surplus");
  });

  it("should surface a cap warning when the goal delta was capped", () => {
    // Arrange
    const balance: DayEnergyBalance = { ...baseBalance, target_kcal: 1900 };
    const goal = goalContext({
      capped: true,
      capReason: "0.75%/week rate cap",
    });

    // Act
    const vm = toEnergyBalanceViewModel(balance, goal);

    // Assert
    expect(vm.target).toBe("1900 kcal");
    expect(vm.capWarning).toContain("safe rate");
  });

  it("should surface an override warning when the user overrode the cap", () => {
    // Arrange
    const goal = goalContext({
      capped: true,
      capReason: "0.75%/week rate cap",
      overridden: true,
    });

    // Act
    const vm = toEnergyBalanceViewModel(baseBalance, goal);

    // Assert
    expect(vm.capWarning).not.toBeNull();
    expect(vm.capWarning).toContain("override");
  });

  it("should leave the cap warning null when the goal is not capped", () => {
    // Arrange
    const goal = goalContext({ dailyDeltaKcal: -300 });

    // Act
    const vm = toEnergyBalanceViewModel(baseBalance, goal);

    // Assert
    expect(vm.capWarning).toBeNull();
  });
});
