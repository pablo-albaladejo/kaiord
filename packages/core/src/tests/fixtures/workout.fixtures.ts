import { faker } from "@faker-js/faker";
import { Factory } from "rosie";
import type { DurationType } from "../../domain/types/duration";
import type { TargetType } from "../../domain/types/target";
import type {
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../domain/types/workout";

export const buildWorkoutStep = new Factory<WorkoutStep>()
  .attr("stepIndex", () => faker.number.int({ max: 50, min: 0 }))
  .attr("durationType", () =>
    faker.helpers.arrayElement([
      "time" as DurationType.Time,
      "distance" as DurationType.Distance,
      "open" as DurationType.Open,
    ])
  )
  .attr("duration", ["durationType"], (durationType: DurationType) => {
    if (durationType === "time") {
      return {
        type: "time" as const,
        seconds: faker.number.int({ max: 3600, min: 30 }),
      };
    } else if (durationType === "distance") {
      return {
        type: "distance" as const,
        meters: faker.number.int({ max: 10000, min: 100 }),
      };
    } else {
      return { type: "open" as const };
    }
  })
  .attr("targetType", () =>
    faker.helpers.arrayElement([
      "power" as TargetType.Power,
      "heart_rate" as TargetType.HeartRate,
      "cadence" as TargetType.Cadence,
      "pace" as TargetType.Pace,
      "open" as TargetType.Open,
    ])
  )
  .attr("target", ["targetType"], (targetType: TargetType) => {
    if (targetType === "power") {
      const unit = faker.helpers.arrayElement([
        "watts",
        "percent_ftp",
        "zone",
        "range",
      ] as const);
      if (unit === "watts") {
        return {
          type: "power" as const,
          value: {
            unit: "watts" as const,
            value: faker.number.int({ max: 400, min: 100 }),
          },
        };
      } else if (unit === "percent_ftp") {
        return {
          type: "power" as const,
          value: {
            unit: "percent_ftp" as const,
            value: faker.number.int({ max: 150, min: 50 }),
          },
        };
      } else if (unit === "zone") {
        return {
          type: "power" as const,
          value: {
            unit: "zone" as const,
            value: faker.number.int({ max: 7, min: 1 }),
          },
        };
      } else {
        return {
          type: "power" as const,
          value: {
            unit: "range" as const,
            min: faker.number.int({ max: 200, min: 100 }),
            max: faker.number.int({ max: 400, min: 250 }),
          },
        };
      }
    } else if (targetType === "heart_rate") {
      const unit = faker.helpers.arrayElement([
        "bpm",
        "zone",
        "percent_max",
        "range",
      ] as const);
      if (unit === "bpm") {
        return {
          type: "heart_rate" as const,
          value: {
            unit: "bpm" as const,
            value: faker.number.int({ max: 200, min: 60 }),
          },
        };
      } else if (unit === "zone") {
        return {
          type: "heart_rate" as const,
          value: {
            unit: "zone" as const,
            value: faker.number.int({ max: 5, min: 1 }),
          },
        };
      } else if (unit === "percent_max") {
        return {
          type: "heart_rate" as const,
          value: {
            unit: "percent_max" as const,
            value: faker.number.int({ max: 100, min: 50 }),
          },
        };
      } else {
        return {
          type: "heart_rate" as const,
          value: {
            unit: "range" as const,
            min: faker.number.int({ max: 140, min: 100 }),
            max: faker.number.int({ max: 180, min: 150 }),
          },
        };
      }
    } else if (targetType === "cadence") {
      const unit = faker.helpers.arrayElement(["rpm", "range"] as const);
      if (unit === "rpm") {
        return {
          type: "cadence" as const,
          value: {
            unit: "rpm" as const,
            value: faker.number.int({ max: 120, min: 60 }),
          },
        };
      } else {
        return {
          type: "cadence" as const,
          value: {
            unit: "range" as const,
            min: faker.number.int({ max: 80, min: 60 }),
            max: faker.number.int({ max: 110, min: 90 }),
          },
        };
      }
    } else if (targetType === "pace") {
      const unit = faker.helpers.arrayElement([
        "mps",
        "zone",
        "range",
      ] as const);
      if (unit === "mps") {
        return {
          type: "pace" as const,
          value: {
            unit: "mps" as const,
            value: faker.number.float({ fractionDigits: 2, max: 6, min: 2 }),
          },
        };
      } else if (unit === "zone") {
        return {
          type: "pace" as const,
          value: {
            unit: "zone" as const,
            value: faker.number.int({ max: 5, min: 1 }),
          },
        };
      } else {
        return {
          type: "pace" as const,
          value: {
            unit: "range" as const,
            min: faker.number.float({ fractionDigits: 2, max: 4, min: 2 }),
            max: faker.number.float({ fractionDigits: 2, max: 6, min: 4.5 }),
          },
        };
      }
    } else {
      return { type: "open" as const };
    }
  });

export const buildRepetitionBlock = new Factory<RepetitionBlock>()
  .attr("repeatCount", () => faker.number.int({ max: 10, min: 2 }))
  .attr("steps", () => [buildWorkoutStep.build(), buildWorkoutStep.build()]);

export const buildWorkout = new Factory<Workout>()
  .attr("name", () => faker.lorem.words({ max: 5, min: 1 }))
  .attr("sport", () =>
    faker.helpers.arrayElement(["running", "cycling", "swimming"])
  )
  .attr("steps", () => [
    buildWorkoutStep.build(),
    buildRepetitionBlock.build(),
    buildWorkoutStep.build(),
  ]);
