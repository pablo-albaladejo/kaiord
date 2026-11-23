/**
 * Backup Download Utility
 *
 * Utility for downloading a workout backup as a KRD file.
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
