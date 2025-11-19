/**
 * Backup Download Utility
 *
 * Utility for downloading workout backups before risky operations.
 *
 * Requirements:
 * - Requirement 36.5: Offer to download backup before risky operations
 */

import type { KRD } from "../types/krd";

/**
 * Download a workout as a backup JSON file
 */
export const downloadBackup = (workout: KRD, filename?: string): void => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const defaultFilename = `workout-backup-${timestamp}.krd`;
  const finalFilename = filename || defaultFilename;

  const json = JSON.stringify(workout, null, 2);
  const blob = new Blob([json], { type: "application/vnd.kaiord+json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Create a backup prompt that offers to download before proceeding
 * Returns a promise that resolves to true if user wants to proceed
 */
export const promptBackupDownload = async (
  workout: KRD,
  operationName: string
): Promise<boolean> => {
  const message = `This operation (${operationName}) may modify your workout significantly. Would you like to download a backup first?`;

  const shouldDownload = window.confirm(message);

  if (shouldDownload) {
    downloadBackup(workout);

    // Give user time to see the download
    await new Promise((resolve) => setTimeout(resolve, 500));

    const proceed = window.confirm(
      "Backup downloaded. Do you want to proceed with the operation?"
    );
    return proceed;
  }

  // User declined backup, ask if they still want to proceed
  const proceedWithoutBackup = window.confirm(
    "Are you sure you want to proceed without a backup?"
  );
  return proceedWithoutBackup;
};
