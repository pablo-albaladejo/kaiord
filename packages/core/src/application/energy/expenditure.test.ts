import { describe, expect, it } from "vitest";

import { type DayExpenditureInput, resolveDayExpenditure } from "./expenditure";

const ACTIVE_KCAL = 600;
const RESTING_KCAL = 1700;
const BMR_KCAL = 1750;
const EXPECTED_ACTIVITY_KCAL = 450;

const MEASURED_INPUT: DayExpenditureInput = {
  measured: { activeCalories: ACTIVE_KCAL, restingCalories: RESTING_KCAL },
  bmrKcal: BMR_KCAL,
  expectedActivityKcal: EXPECTED_ACTIVITY_KCAL,
};

const PREDICTED_INPUT: DayExpenditureInput = {
  bmrKcal: BMR_KCAL,
  expectedActivityKcal: EXPECTED_ACTIVITY_KCAL,
};

describe("resolveDayExpenditure (measured)", () => {
  it("should sum resting and active calories when measured wellness is present", () => {
    // Arrange
    const input = MEASURED_INPUT;

    // Act
    const result = resolveDayExpenditure(input);

    // Assert
    expect(result.source).toBe("measured");
    expect(result.basalKcal).toBe(RESTING_KCAL);
    expect(result.activityKcal).toBe(ACTIVE_KCAL);
    expect(result.expenditureKcal).toBe(RESTING_KCAL + ACTIVE_KCAL);
  });

  it("should prefer measured data even when a predicted fallback is available", () => {
    // Arrange
    const input: DayExpenditureInput = {
      ...MEASURED_INPUT,
      bmrKcal: 9999,
      expectedActivityKcal: 9999,
    };

    // Act
    const result = resolveDayExpenditure(input);

    // Assert
    expect(result.source).toBe("measured");
    expect(result.expenditureKcal).toBe(RESTING_KCAL + ACTIVE_KCAL);
  });

  it("should accept zero measured calories without falling back to predicted", () => {
    // Arrange
    const input: DayExpenditureInput = {
      ...PREDICTED_INPUT,
      measured: { activeCalories: 0, restingCalories: 0 },
    };

    // Act
    const result = resolveDayExpenditure(input);

    // Assert
    expect(result.source).toBe("measured");
    expect(result.expenditureKcal).toBe(0);
  });
});

describe("resolveDayExpenditure (predicted)", () => {
  it("should sum BMR and expected activity when no measured wellness is present", () => {
    // Arrange
    const input = PREDICTED_INPUT;

    // Act
    const result = resolveDayExpenditure(input);

    // Assert
    expect(result.source).toBe("predicted");
    expect(result.basalKcal).toBe(BMR_KCAL);
    expect(result.activityKcal).toBe(EXPECTED_ACTIVITY_KCAL);
    expect(result.expenditureKcal).toBe(BMR_KCAL + EXPECTED_ACTIVITY_KCAL);
  });

  it("should allow zero expected activity for a rest day", () => {
    // Arrange
    const input: DayExpenditureInput = {
      bmrKcal: BMR_KCAL,
      expectedActivityKcal: 0,
    };

    // Act
    const result = resolveDayExpenditure(input);

    // Assert
    expect(result.source).toBe("predicted");
    expect(result.expenditureKcal).toBe(BMR_KCAL);
  });
});

describe("resolveDayExpenditure (input guards)", () => {
  it("should throw RangeError for negative measured calories", () => {
    // Arrange
    const input: DayExpenditureInput = {
      ...PREDICTED_INPUT,
      measured: { activeCalories: -1, restingCalories: RESTING_KCAL },
    };

    // Act
    const act = () => resolveDayExpenditure(input);

    // Assert
    expect(act).toThrow(RangeError);
  });

  it("should throw RangeError for a non-finite BMR in the predicted path", () => {
    // Arrange
    const input: DayExpenditureInput = {
      bmrKcal: Number.NaN,
      expectedActivityKcal: EXPECTED_ACTIVITY_KCAL,
    };

    // Act
    const act = () => resolveDayExpenditure(input);

    // Assert
    expect(act).toThrow(RangeError);
  });
});

describe("resolveDayExpenditure (NEAT factor)", () => {
  const NEAT_FACTOR = 1.4;

  it("should scale the predicted basal by neatFactor without double-counting activity", () => {
    // Arrange
    const input: DayExpenditureInput = {
      bmrKcal: BMR_KCAL,
      expectedActivityKcal: EXPECTED_ACTIVITY_KCAL,
      neatFactor: NEAT_FACTOR,
    };

    // Act
    const result = resolveDayExpenditure(input);

    // Assert
    expect(result.basalKcal).toBe(BMR_KCAL * NEAT_FACTOR);
    expect(result.activityKcal).toBe(EXPECTED_ACTIVITY_KCAL);
    expect(result.expenditureKcal).toBe(
      BMR_KCAL * NEAT_FACTOR + EXPECTED_ACTIVITY_KCAL
    );
  });

  it("should raise a rest-day basal above raw BMR when neatFactor is applied", () => {
    // Arrange
    const input: DayExpenditureInput = {
      bmrKcal: BMR_KCAL,
      expectedActivityKcal: 0,
      neatFactor: NEAT_FACTOR,
    };

    // Act
    const result = resolveDayExpenditure(input);

    // Assert
    expect(result.expenditureKcal).toBe(BMR_KCAL * NEAT_FACTOR);
    expect(result.expenditureKcal).toBeGreaterThan(BMR_KCAL);
  });

  it("should keep the basal at raw BMR when neatFactor is omitted", () => {
    // Arrange
    const input: DayExpenditureInput = {
      bmrKcal: BMR_KCAL,
      expectedActivityKcal: 0,
    };

    // Act
    const result = resolveDayExpenditure(input);

    // Assert
    expect(result.basalKcal).toBe(BMR_KCAL);
  });

  it("should throw RangeError for a neatFactor below one", () => {
    // Arrange
    const input: DayExpenditureInput = {
      bmrKcal: BMR_KCAL,
      expectedActivityKcal: EXPECTED_ACTIVITY_KCAL,
      neatFactor: 0.9,
    };

    // Act
    const act = () => resolveDayExpenditure(input);

    // Assert
    expect(act).toThrow(RangeError);
  });

  it("should throw RangeError for a non-finite neatFactor", () => {
    // Arrange
    const input: DayExpenditureInput = {
      bmrKcal: BMR_KCAL,
      expectedActivityKcal: EXPECTED_ACTIVITY_KCAL,
      neatFactor: Number.POSITIVE_INFINITY,
    };

    // Act
    const act = () => resolveDayExpenditure(input);

    // Assert
    expect(act).toThrow(RangeError);
  });
});
