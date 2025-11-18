import { describe, expect, it } from "vitest";
import { mapFreeRideToKrd } from "./free-ride.mapper";
import { mapIntervalsTToKrd } from "./intervals-t.mapper";
import { mapRampToKrd } from "./ramp.mapper";
import { mapSteadyStateToKrd } from "./steady-state.mapper";

describe("text event extraction", () => {
  describe("single text event", () => {
    it("should extract message to notes for SteadyState", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
        textevent: {
          message: "Push hard!",
          timeoffset: 0,
        },
      };

      // Act
      const result = mapSteadyStateToKrd(data);

      // Assert
      expect(result.notes).toBe("Push hard!");
      expect(result.extensions).toStrictEqual({
        zwift: {
          textEvents: [
            {
              message: "Push hard!",
              timeoffset: 0,
            },
          ],
        },
      });
    });

    it("should extract message to notes for Ramp", () => {
      // Arrange
      const data = {
        Duration: 600,
        durationType: "time" as const,
        PowerLow: 0.5,
        PowerHigh: 0.75,
        stepIndex: 0,
        textevent: {
          message: "Gradual increase",
          timeoffset: 0,
        },
      };

      // Act
      const result = mapRampToKrd(data);

      // Assert
      expect(result.notes).toBe("Gradual increase");
      expect(result.extensions).toStrictEqual({
        zwift: {
          textEvents: [
            {
              message: "Gradual increase",
              timeoffset: 0,
            },
          ],
        },
      });
    });

    it("should extract message to notes for FreeRide", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        stepIndex: 0,
        textevent: {
          message: "Ride at your own pace",
          timeoffset: 0,
        },
      };

      // Act
      const result = mapFreeRideToKrd(data);

      // Assert
      expect(result.notes).toBe("Ride at your own pace");
      expect(result.extensions).toStrictEqual({
        zwift: {
          textEvents: [
            {
              message: "Ride at your own pace",
              timeoffset: 0,
            },
          ],
        },
      });
    });

    it("should extract message to notes for IntervalsT", () => {
      // Arrange
      const data = {
        Repeat: 8,
        OnDuration: 30,
        OnPower: 1.2,
        OffDuration: 30,
        OffPower: 0.5,
        durationType: "time" as const,
        stepIndex: 0,
        textevent: {
          message: "Sprint intervals!",
          timeoffset: 0,
        },
      };

      // Act
      const result = mapIntervalsTToKrd(data);

      // Assert
      expect(result.steps[0].notes).toBe("Sprint intervals!");
      expect(result.steps[0].extensions).toStrictEqual({
        zwift: {
          textEvents: [
            {
              message: "Sprint intervals!",
              timeoffset: 0,
            },
          ],
        },
      });
    });
  });

  describe("multiple text events", () => {
    it("should store primary message in notes and all events in extensions", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
        textevent: [
          {
            message: "Start strong",
            timeoffset: 0,
          },
          {
            message: "Keep it up",
            timeoffset: 150,
          },
          {
            message: "Final push",
            timeoffset: 270,
          },
        ],
      };

      // Act
      const result = mapSteadyStateToKrd(data);

      // Assert
      expect(result.notes).toBe("Start strong");
      expect(result.extensions).toStrictEqual({
        zwift: {
          textEvents: [
            {
              message: "Start strong",
              timeoffset: 0,
            },
            {
              message: "Keep it up",
              timeoffset: 150,
            },
            {
              message: "Final push",
              timeoffset: 270,
            },
          ],
        },
      });
    });

    it("should handle text events with distance offsets", () => {
      // Arrange
      const data = {
        Duration: 5000,
        durationType: "distance" as const,
        Power: 1.0,
        stepIndex: 0,
        textevent: [
          {
            message: "Start",
            distoffset: 0,
          },
          {
            message: "Halfway",
            distoffset: 2500,
          },
        ],
      };

      // Act
      const result = mapSteadyStateToKrd(data);

      // Assert
      expect(result.notes).toBe("Start");
      expect(result.extensions).toStrictEqual({
        zwift: {
          textEvents: [
            {
              message: "Start",
              distoffset: 0,
            },
            {
              message: "Halfway",
              distoffset: 2500,
            },
          ],
        },
      });
    });
  });

  describe("no text events", () => {
    it("should not add notes or extensions when no text events", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
      };

      // Act
      const result = mapSteadyStateToKrd(data);

      // Assert
      expect(result.notes).toBeUndefined();
      expect(result.extensions).toBeUndefined();
    });

    it("should not add notes or extensions when empty array", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
        textevent: [],
      };

      // Act
      const result = mapSteadyStateToKrd(data);

      // Assert
      expect(result.notes).toBeUndefined();
      expect(result.extensions).toBeUndefined();
    });
  });

  describe("text events with FlatRoad extension", () => {
    it("should merge text events with FlatRoad extension in FreeRide", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        stepIndex: 0,
        FlatRoad: 1,
        textevent: {
          message: "Easy ride",
          timeoffset: 0,
        },
      };

      // Act
      const result = mapFreeRideToKrd(data);

      // Assert
      expect(result.notes).toBe("Easy ride");
      expect(result.extensions).toStrictEqual({
        zwift: {
          textEvents: [
            {
              message: "Easy ride",
              timeoffset: 0,
            },
          ],
          FlatRoad: 1,
        },
      });
    });
  });
});
