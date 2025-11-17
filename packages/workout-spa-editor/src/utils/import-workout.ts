import type { KRD } from "@kaiord/core";
import { createDefaultProviders } from "@kaiord/core";
import { detectFormat, getFormatErrorMessage } from "./file-format-detector";

/**
 * Import a workout file and convert it to KRD format
 *
 * @param file - The file to import
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns Promise resolving to KRD object
 * @throws Error if format is unsupported or conversion fails
 */
export const importWorkout = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<KRD> => {
  // Detect format from filename
  const format = detectFormat(file.name);

  if (!format) {
    throw new Error(
      `Unsupported file format. Supported formats: .fit, .tcx, .pwx, .krd, .json`
    );
  }

  // Report initial progress
  onProgress?.(10);

  // Read file as buffer
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  onProgress?.(30);

  // Handle KRD/JSON files directly
  if (format === "krd") {
    try {
      const text = new TextDecoder().decode(uint8Array);
      const krd = JSON.parse(text) as KRD;
      onProgress?.(100);
      return krd;
    } catch (error) {
      throw new Error(
        `Failed to parse KRD JSON: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Convert FIT files using @kaiord/core
  if (format === "fit") {
    try {
      const providers = createDefaultProviders();
      onProgress?.(50);

      const krd = await providers.convertFitToKrd({ fitBuffer: uint8Array });
      onProgress?.(100);

      return krd;
    } catch (error) {
      const errorMessage = getFormatErrorMessage(format);
      throw new Error(
        `${errorMessage} ${error instanceof Error ? error.message : ""}`
      );
    }
  }

  // TCX and PWX not yet implemented
  throw new Error(
    `${format.toUpperCase()} format conversion is not yet implemented`
  );
};
