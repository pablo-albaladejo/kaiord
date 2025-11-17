import type { KRD } from "@kaiord/core";
import { createDefaultProviders } from "@kaiord/core";
import type { SupportedFormat } from "./file-format-detector";
import { getFormatErrorMessage, getMimeType } from "./file-format-detector";

/**
 * Export a KRD workout to the specified format
 *
 * @param krd - The KRD workout to export
 * @param format - The target format (fit, tcx, pwx, krd)
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns Promise resolving to Blob containing the exported file
 * @throws Error if format is unsupported or conversion fails
 */
export const exportWorkout = async (
  krd: KRD,
  format: SupportedFormat,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  onProgress?.(10);

  // Handle KRD format (no conversion needed)
  if (format === "krd") {
    const json = JSON.stringify(krd, null, 2);
    const blob = new Blob([json], { type: getMimeType("krd") });
    onProgress?.(100);
    return blob;
  }

  onProgress?.(30);

  // Convert to target format using @kaiord/core
  try {
    const buffer = await exportToFormat(krd, format, onProgress);
    const mimeType = getMimeType(format);
    // Create blob from buffer - ensure it's a proper BlobPart
    const blob = new Blob([buffer.buffer], { type: mimeType });

    onProgress?.(100);
    return blob;
  } catch (error) {
    const errorMessage = getFormatErrorMessage(format);
    throw new Error(
      `${errorMessage} ${error instanceof Error ? error.message : ""}`
    );
  }
};

/**
 * Convert KRD to specific format using @kaiord/core
 */
const exportToFormat = async (
  krd: KRD,
  format: SupportedFormat,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> => {
  const providers = createDefaultProviders();

  switch (format) {
    case "fit":
      onProgress?.(50);
      return await providers.convertKrdToFit({ krd });

    case "tcx":
      onProgress?.(50);
      // TODO: Implement TCX conversion once @kaiord/core supports it
      throw new Error(
        "TCX format conversion is not yet implemented in @kaiord/core"
      );

    case "pwx":
      onProgress?.(50);
      // TODO: Implement PWX conversion once @kaiord/core supports it
      throw new Error(
        "PWX format conversion is not yet implemented in @kaiord/core"
      );

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

/**
 * Trigger a file download in the browser
 *
 * @param blob - The blob to download
 * @param filename - The filename for the download
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate a filename for the exported workout
 *
 * @param workoutName - The name of the workout
 * @param format - The export format
 * @returns Filename with appropriate extension
 */
export const generateFilename = (
  workoutName: string,
  format: SupportedFormat
): string => {
  // Sanitize workout name for filename
  const sanitized = workoutName
    .replace(/[^a-z0-9_-]/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();

  const name = sanitized || "workout";
  return `${name}.${format}`;
};
