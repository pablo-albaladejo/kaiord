/**
 * Kaiord Garmin Bridge — the bodies a write may carry
 *
 * One schema per write entry of the closed list, in the shape the vendored
 * bridge-request-gate.js checks, so the extension forwards only what the
 * App's Garmin Connector builds and never an arbitrary payload:
 *   - `workout`: the GCN @kaiord/garmin's writer emits (one segment of
 *     executable steps and repeat groups of executable steps, every key
 *     named, Garmin's own type keys, bounded strings and counts, the
 *     workout description cut to DESCRIPTION_MAX by the writer);
 *   - `fit-file`: the body-composition upload (garmin-fit-check.js);
 *   - `schedule`: one calendar date.
 */

// Wrapped so its names never meet the worker's own top-level declarations:
// importScripts shares one global lexical scope.
const garminRequestBodies = (() => {
  const fitCheck =
    typeof require !== "undefined"
      ? require("./garmin-fit-check.js")
      : self.garminFitCheck;

  const MAX_STEPS = 100;
  const MAX_REPEAT_STEPS = 50;
  const NAME_MAX = 255;
  // A step description: the bound @kaiord/garmin's writer cuts a step's
  // notes to (GARMIN_STEP_NOTES_MAX), so a longer one is not a body it built.
  const NOTES_MAX = 200;
  const DESCRIPTION_MAX = 1024;

  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keyOf = (keys) => ({
    type: "string",
    min: 1,
    max: 32,
    pattern: new RegExp(`^(?:${keys.map(escape).join("|")})$`),
  });
  const id = { type: "integer", min: 0, max: 999 };
  const order = { type: "integer", min: 0, max: 99 };
  const numberOrNull = { type: "number", nullable: true };
  const zoneOrNull = { type: "integer", min: 0, max: 100, nullable: true };

  const SPORT_TYPE = {
    type: "object",
    fields: {
      sportTypeId: id,
      sportTypeKey: keyOf([
        "running",
        "cycling",
        "hiking",
        "swimming",
        "strength_training",
        "cardio_training",
        "multi_sport",
      ]),
      displayOrder: { ...order, optional: true },
    },
  };
  const STEP_TYPE = (keys) => ({
    type: "object",
    fields: { stepTypeId: id, stepTypeKey: keyOf(keys), displayOrder: order },
  });
  const CONDITION = (keys) => ({
    type: "object",
    fields: {
      conditionTypeId: id,
      conditionTypeKey: keyOf(keys),
      displayOrder: order,
      displayable: { type: "boolean" },
    },
  });
  const TARGET_TYPE = {
    type: "object",
    fields: {
      workoutTargetTypeId: id,
      workoutTargetTypeKey: keyOf([
        "no.target",
        "power.zone",
        "cadence",
        "heart.rate.zone",
        "pace.zone",
      ]),
      displayOrder: order,
    },
  };
  const NULLABLE_KEY = (name, keys) => ({
    type: "object",
    fields: {
      [`${name}TypeId`]: id,
      [`${name}TypeKey`]: { ...keyOf(keys), nullable: true },
      displayOrder: order,
    },
  });

  const EXECUTABLE_STEP = {
    type: "object",
    fields: {
      type: { type: "literal", value: "ExecutableStepDTO" },
      stepOrder: { type: "integer", min: 1, max: 999 },
      stepType: STEP_TYPE([
        "warmup",
        "cooldown",
        "interval",
        "recovery",
        "rest",
      ]),
      endCondition: CONDITION(["lap.button", "time", "distance", "calories"]),
      endConditionValue: { type: "number", min: 0 },
      targetType: TARGET_TYPE,
      targetValueOne: numberOrNull,
      targetValueTwo: numberOrNull,
      zoneNumber: zoneOrNull,
      secondaryTargetType: { ...TARGET_TYPE, nullable: true },
      secondaryTargetValueOne: numberOrNull,
      secondaryTargetValueTwo: numberOrNull,
      secondaryZoneNumber: zoneOrNull,
      strokeType: NULLABLE_KEY("stroke", [
        "free",
        "backstroke",
        "breaststroke",
        "fly",
        "drill",
        "mixed",
        "im",
      ]),
      equipmentType: NULLABLE_KEY("equipment", [
        "fins",
        "kickboard",
        "paddles",
        "pull_buoy",
        "snorkel",
      ]),
      description: { type: "string", max: NOTES_MAX, optional: true },
    },
  };

  const REPEAT_GROUP = {
    type: "object",
    fields: {
      type: { type: "literal", value: "RepeatGroupDTO" },
      stepOrder: { type: "integer", min: 1, max: 999 },
      stepType: STEP_TYPE(["repeat"]),
      numberOfIterations: { type: "integer", min: 1, max: 999 },
      endCondition: CONDITION(["iterations"]),
      endConditionValue: { type: "number", min: 1, max: 999 },
      workoutSteps: {
        type: "array",
        min: 1,
        max: MAX_REPEAT_STEPS,
        items: EXECUTABLE_STEP,
      },
    },
  };

  const WORKOUT = {
    type: "object",
    fields: {
      workoutName: { type: "string", min: 1, max: NAME_MAX },
      description: { type: "string", max: DESCRIPTION_MAX, optional: true },
      sportType: SPORT_TYPE,
      workoutSegments: {
        type: "array",
        min: 1,
        max: 1,
        items: {
          type: "object",
          fields: {
            segmentOrder: { type: "literal", value: 1 },
            sportType: SPORT_TYPE,
            workoutSteps: {
              type: "array",
              min: 1,
              max: MAX_STEPS,
              items: { type: "anyOf", of: [EXECUTABLE_STEP, REPEAT_GROUP] },
            },
          },
        },
      },
      poolLength: { type: "number", min: 0, optional: true },
      poolLengthUnit: {
        type: "object",
        optional: true,
        fields: {
          unitId: id,
          unitKey: keyOf(["meter"]),
          factor: { type: "number", min: 0 },
        },
      },
      isSessionTransitionEnabled: { type: "boolean", optional: true },
    },
  };

  const BODY_SCHEMAS = {
    workout: WORKOUT,
    "fit-file": { type: "custom", test: fitCheck.isBodyCompositionFit },
    schedule: { type: "object", fields: { date: { type: "date" } } },
  };

  return { BODY_SCHEMAS, MAX_STEPS, MAX_REPEAT_STEPS, DESCRIPTION_MAX };
})();

if (typeof module !== "undefined") {
  module.exports = garminRequestBodies;
} else if (typeof self !== "undefined") {
  self.garminRequestBodies = garminRequestBodies;
}
