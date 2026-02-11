import { writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { krdSchema } from "../src/domain/schemas/krd.js";
import { workoutSchema } from "../src/domain/schemas/workout.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const schemaDir = resolve(__dirname, "../schema");

const writeSchema = (path: string, data: object) =>
  writeFileSync(path, JSON.stringify(data, null, 2));

// Generate Workout schema (for extensions.structured_workout)
const workoutJsonSchema = z.toJSONSchema(workoutSchema);

const workoutOutputPath = resolve(schemaDir, "workout.json");
writeSchema(workoutOutputPath, {
  ...workoutJsonSchema,
  $id: "https://kaiord.dev/schema/workout.json",
  title: "Workout Schema",
  description: "Workout structure for KRD extensions.structured_workout field",
});
console.log(`✓ Workout Schema generated at ${workoutOutputPath}`);

// Generate KRD schema with reference to workout schema
const krdJsonSchema = z.toJSONSchema(krdSchema) as Record<string, unknown> & {
  properties?: Record<string, unknown>;
};

if (krdJsonSchema.properties?.extensions) {
  krdJsonSchema.properties.extensions = {
    type: "object",
    properties: {
      structured_workout: { $ref: "workout.json" },
      fit: { type: "object", additionalProperties: true },
    },
    additionalProperties: true,
  };
}

const krdOutputPath = resolve(schemaDir, "krd.json");
writeSchema(krdOutputPath, {
  ...krdJsonSchema,
  $id: "https://kaiord.dev/schema/krd.json",
  title: "KRD Schema",
  description:
    "Kaiord Representation Definition (KRD) for workout and activity data",
});
console.log(`✓ KRD Schema generated at ${krdOutputPath}`);

// Generate combined schema for LLM agents (all types inlined)
const fullJsonSchema = z.toJSONSchema(workoutSchema);

const fullOutputPath = resolve(schemaDir, "structured-workout-full.json");
writeSchema(fullOutputPath, {
  ...fullJsonSchema,
  $id: "https://kaiord.dev/schema/structured-workout-full.json",
  title: "Structured Workout - Complete Schema",
  description:
    "Self-contained schema for LLM agents to generate structured workouts. All domain types (sport, duration, target, intensity) are inlined.",
});
console.log(`✓ Structured Workout Full Schema generated at ${fullOutputPath}`);
