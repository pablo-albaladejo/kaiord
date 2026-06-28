import { describe, expect, it } from "vitest";

import { profileSchema } from "./profile";

const BASE = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Athlete",
  sportZones: {},
  createdAt: "2026-06-21T08:00:00.000Z",
  updatedAt: "2026-06-21T08:00:00.000Z",
};

describe("profileSchema anthropometric fields", () => {
  it("should accept a profile without any physiological fields", () => {
    // Arrange
    const input = BASE;

    // Act
    const result = profileSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept the full physiological field set", () => {
    // Arrange
    const input = {
      ...BASE,
      height: 178,
      birthDate: "1990-05-12",
      sex: "male",
      restingHeartRate: 52,
      activityLevel: "moderate",
    };

    // Act
    const result = profileSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it.each([
    { field: "height", value: 0 },
    { field: "sex", value: "other" },
    { field: "birthDate", value: "1990/05/12" },
    { field: "activityLevel", value: "extreme" },
  ])("should reject an invalid $field", ({ field, value }) => {
    // Arrange
    const input = { ...BASE, [field]: value };

    // Act
    const result = profileSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
