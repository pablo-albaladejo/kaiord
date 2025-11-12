import { writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { zodToJsonSchema } from "zod-to-json-schema";
import { krdSchema } from "../src/domain/schemas/krd.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jsonSchema = zodToJsonSchema(krdSchema, {
  name: "KRD",
  $refStrategy: "none",
});

const schemaWithMetadata = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://kaiord.dev/schema/workout.json",
  title: "KRD Workout Schema",
  description: "Kaiord Representation Definition (KRD) for workout data",
  ...jsonSchema,
};

const outputPath = resolve(__dirname, "../schema/workout.json");
writeFileSync(outputPath, JSON.stringify(schemaWithMetadata, null, 2));

console.log(`✓ JSON Schema generated at ${outputPath}`);
