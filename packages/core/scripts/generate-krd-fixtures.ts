#!/usr/bin/env tsx
/**
 * Generate KRD fixtures from FIT test files
 *
 * This script converts all FIT files in src/tests/fixtures/fit-files/
 * to KRD format and saves them in src/tests/fixtures/krd-files/
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { basename, join } from "path";
import { createGarminFitSdkReader } from "../src/adapters/fit/garmin-fitsdk.js";
import { createConsoleLogger } from "../src/adapters/logger/console-logger.js";

const logger = createConsoleLogger();
const fitReader = createGarminFitSdkReader(logger);

const FIT_FILES_DIR = join(process.cwd(), "src/tests/fixtures/fit-files");
const KRD_FILES_DIR = join(process.cwd(), "src/tests/fixtures/krd-files");

async function main() {
  console.log("🔄 Generating KRD fixtures from FIT files...\n");

  // Create output directory if it doesn't exist
  mkdirSync(KRD_FILES_DIR, { recursive: true });

  // Get all FIT files
  const fitFiles = readdirSync(FIT_FILES_DIR).filter((file) =>
    file.endsWith(".fit")
  );

  if (fitFiles.length === 0) {
    console.log("⚠️  No FIT files found in", FIT_FILES_DIR);
    return;
  }

  console.log(`Found ${fitFiles.length} FIT file(s):\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const fitFile of fitFiles) {
    const fitPath = join(FIT_FILES_DIR, fitFile);
    const krdFileName = basename(fitFile, ".fit") + ".krd";
    const krdPath = join(KRD_FILES_DIR, krdFileName);

    try {
      console.log(`  📄 ${fitFile}`);

      // Read FIT file
      const fitBuffer = readFileSync(fitPath);

      // Convert to KRD
      const krd = await fitReader(fitBuffer);

      // Write KRD file (pretty-printed JSON)
      writeFileSync(krdPath, JSON.stringify(krd, null, 2), "utf-8");

      console.log(`     ✅ Generated ${krdFileName}\n`);
      successCount++;
    } catch (error) {
      console.error(`     ❌ Failed to convert ${fitFile}`);
      console.error(
        `        ${error instanceof Error ? error.message : String(error)}\n`
      );
      errorCount++;
    }
  }

  console.log("─".repeat(50));
  console.log(`✨ Done! ${successCount} succeeded, ${errorCount} failed`);
  console.log(`📁 KRD files saved to: ${KRD_FILES_DIR}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
