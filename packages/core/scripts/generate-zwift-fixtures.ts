#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createGarminFitSdkReader } from "../src/adapters/fit/garmin-fitsdk";
import { createConsoleLogger } from "../src/adapters/logger/console-logger";
import { createFastXmlZwiftWriter } from "../src/adapters/zwift/fast-xml-parser";
import { createXsdZwiftValidator } from "../src/adapters/zwift/xsd-validator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = createConsoleLogger();

const fitFiles = [
  "WorkoutIndividualSteps.fit",
  "WorkoutRepeatSteps.fit",
  "WorkoutRepeatGreaterThanStep.fit",
  "WorkoutCustomTargetValues.fit",
];

const fitToZwoMapping: Record<string, string> = {
  "WorkoutIndividualSteps.fit": "WorkoutIndividualSteps.zwo",
  "WorkoutRepeatSteps.fit": "WorkoutRepeatSteps.zwo",
  "WorkoutRepeatGreaterThanStep.fit": "WorkoutRepeatGreaterThanStep.zwo",
  "WorkoutCustomTargetValues.fit": "WorkoutCustomTargetValues.zwo",
};

async function generateZwiftFixtures() {
  const fitReader = createGarminFitSdkReader(logger);
  const zwiftValidator = createXsdZwiftValidator(logger);
  const zwiftWriter = createFastXmlZwiftWriter(logger, zwiftValidator);

  for (const fitFile of fitFiles) {
    try {
      const fitPath = join(
        __dirname,
        "../src/tests/fixtures/fit-files",
        fitFile
      );
      const zwoFile = fitToZwoMapping[fitFile];
      const zwoPath = join(
        __dirname,
        "../src/tests/fixtures/zwift-files",
        zwoFile
      );

      console.log(`\nProcessing ${fitFile} → ${zwoFile}...`);

      // Read FIT file
      const fitBuffer = readFileSync(fitPath);

      // Convert FIT → KRD
      const krd = await fitReader(fitBuffer);
      console.log(`  ✓ Converted to KRD`);

      // Convert KRD → Zwift
      const zwoXml = await zwiftWriter(krd);
      console.log(`  ✓ Converted to Zwift XML`);

      // Write Zwift file
      writeFileSync(zwoPath, zwoXml, "utf-8");
      console.log(`  ✓ Written to ${zwoFile}`);
    } catch (error) {
      console.error(`  ✗ Error processing ${fitFile}:`, error);
    }
  }

  console.log("\n✅ All Zwift fixtures generated successfully!");
}

generateZwiftFixtures().catch((error) => {
  console.error("Failed to generate Zwift fixtures:", error);
  process.exit(1);
});
