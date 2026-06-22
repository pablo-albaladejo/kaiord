import type { DayEnergyBalance } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { DayEnergyBalanceResult } from "../../application/energy/day-energy-balance-result";
import { formatNetBadge, netForDay } from "./calendar-net-balance";

const BASAL_KCAL = 1700;
const ACTIVITY_KCAL = 600;
const EXPENDITURE_KCAL = 2300;
const DEFICIT_KCAL = -600;
const SURPLUS_KCAL = 300;

const balance = (netKcal: number | null): DayEnergyBalance => ({
  date: "2026-06-21",
  basal_kcal: BASAL_KCAL,
  activity_kcal: ACTIVITY_KCAL,
  expenditure_kcal: EXPENDITURE_KCAL,
  intake_kcal: netKcal === null ? null : EXPENDITURE_KCAL + netKcal,
  net_kcal: netKcal,
  target_kcal: null,
  source: "measured",
});

const resolved = (netKcal: number | null): DayEnergyBalanceResult => ({
  gated: false,
  balance: balance(netKcal),
  goal: null,
});

describe("formatNetBadge", () => {
  it("should render a deficit as a bare negative kcal value", () => {
    // Arrange
    const net = DEFICIT_KCAL;

    // Act
    const result = formatNetBadge(net);

    // Assert
    expect(result).toBe("-600");
  });

  it("should render a surplus with a leading plus sign", () => {
    // Arrange
    const net = SURPLUS_KCAL;

    // Act
    const result = formatNetBadge(net);

    // Assert
    expect(result).toBe("+300");
  });
});

describe("netForDay", () => {
  it("should produce a badge for a resolvable day with logged intake", () => {
    // Arrange
    const result = resolved(DEFICIT_KCAL);

    // Act
    const badge = netForDay(result);

    // Assert
    expect(badge).toBe("-600");
  });

  it("should omit the badge when the day is gated", () => {
    // Arrange
    const result: DayEnergyBalanceResult = {
      gated: true,
      reason: "profile-incomplete",
    };

    // Act
    const badge = netForDay(result);

    // Assert
    expect(badge).toBeNull();
  });

  it("should omit the badge when intake is untracked (no net)", () => {
    // Arrange
    const result = resolved(null);

    // Act
    const badge = netForDay(result);

    // Assert
    expect(badge).toBeNull();
  });
});
