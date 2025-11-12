import { writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { zodToJsonSchema } from "zod-to-json-schema";
import { krdSchema } from "../src/domain/schemas/krd.js";
import { workoutSchema } from "../src/domain/schemas/workout.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate Workout schema first (for extensions.workout)
const workoutJsonSchema = zodToJsonSchema(workoutSchema, {
  name: "Workout",
  $refStrategy: "none",
});

const workoutSchemaWithMetadata = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://kaiord.dev/schema/workout.json",
  title: "Workout Schema",
  description: "Workout structure for KRD extensions.workout field",
  ...workoutJsonSchema,
};

const workoutOutputPath = resolve(__dirname, "../schema/workout.json");
writeFileSync(
  workoutOutputPath,
  JSON.stringify(workoutSchemaWithMetadata, null, 2)
);
console.log(`✓ Workout Schema generated at ${workoutOutputPath}`);

// Generate KRD schema with reference to workout schema
const krdJsonSchema = zodToJsonSchema(krdSchema, {
  name: "KRD",
  $refStrategy: "none",
}) as any;

// Add workout schema reference to extensions.workout
if (krdJsonSchema.definitions?.KRD?.properties?.extensions) {
  krdJsonSchema.definitions.KRD.properties.extensions = {
    type: "object",
    properties: {
      workout: {
        $ref: "workout.json#/definitions/Workout",
      },
      fit: {
        type: "object",
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  };
}

const krdSchemaWithMetadata = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://kaiord.dev/schema/krd.json",
  title: "KRD Schema",
  description:
    "Kaiord Representation Definition (KRD) for workout and activity data",
  ...krdJsonSchema,
};

const krdOutputPath = resolve(__dirname, "../schema/krd.json");
writeFileSync(krdOutputPath, JSON.stringify(krdSchemaWithMetadata, null, 2));
console.log(`✓ KRD Schema generated at ${krdOutputPath}`);
