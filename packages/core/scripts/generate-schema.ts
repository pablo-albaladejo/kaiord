import { writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import type { JsonSchema7Type } from "zod-to-json-schema";
import { zodToJsonSchema } from "zod-to-json-schema";
import { krdSchema } from "../src/domain/schemas/krd.js";
import { workoutSchema } from "../src/domain/schemas/workout.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const schemaDir = resolve(__dirname, "../schema");

const writeSchema = (path: string, data: object) =>
  writeFileSync(path, JSON.stringify(data, null, 2));

// Generate Workout schema (for extensions.structured_workout)
const workoutJsonSchema = zodToJsonSchema(workoutSchema, {
  name: "Workout",
  $refStrategy: "none",
});

const workoutOutputPath = resolve(schemaDir, "workout.json");
writeSchema(workoutOutputPath, {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://kaiord.dev/schema/workout.json",
  title: "Workout Schema",
  description: "Workout structure for KRD extensions.structured_workout field",
  ...workoutJsonSchema,
});
console.log(`✓ Workout Schema generated at ${workoutOutputPath}`);

// Generate KRD schema with reference to workout schema
const krdJsonSchema = zodToJsonSchema(krdSchema, {
  name: "KRD",
  $refStrategy: "none",
}) as JsonSchema7Type & {
  definitions?: Record<
    string,
    Record<string, Record<string, Record<string, unknown>>>
  >;
};

if (krdJsonSchema.definitions?.KRD?.properties?.extensions) {
  krdJsonSchema.definitions.KRD.properties.extensions = {
    type: "object",
    properties: {
      structured_workout: { $ref: "workout.json#/definitions/Workout" },
      fit: { type: "object", additionalProperties: true },
    },
    additionalProperties: true,
  };
}

const krdOutputPath = resolve(schemaDir, "krd.json");
writeSchema(krdOutputPath, {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://kaiord.dev/schema/krd.json",
  title: "KRD Schema",
  description:
    "Kaiord Representation Definition (KRD) for workout and activity data",
  ...krdJsonSchema,
});
console.log(`✓ KRD Schema generated at ${krdOutputPath}`);

// Generate combined schema for LLM agents (all types inlined)
const fullJsonSchema = zodToJsonSchema(workoutSchema, {
  name: "StructuredWorkout",
  $refStrategy: "none",
});

const fullOutputPath = resolve(schemaDir, "structured-workout-full.json");
writeSchema(fullOutputPath, {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://kaiord.dev/schema/structured-workout-full.json",
  title: "Structured Workout - Complete Schema",
  description:
    "Self-contained schema for LLM agents to generate structured workouts. All domain types (sport, duration, target, intensity) are inlined.",
  ...fullJsonSchema,
});
console.log(`✓ Structured Workout Full Schema generated at ${fullOutputPath}`);
