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
 * This function uses the modal system instead of browser alerts
 * Returns a promise that resolves to true if user wants to proceed
 */
export const promptBackupDownload = (
  workout: KRD,
  operationName: string,
  showModal: (config: {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant: "default" | "destructive";
  }) => void
): Promise<boolean> => {
  return new Promise((resolve) => {
    const message = `This operation (${operationName}) may modify your workout significantly. Would you like to download a backup first?`;

    showModal({
      title: "Download Backup?",
      message,
      confirmLabel: "Download Backup",
      cancelLabel: "Skip Backup",
      variant: "default",
      onConfirm: () => {
        downloadBackup(workout);

        // Give user time to see the download, then ask to proceed
        setTimeout(() => {
          showModal({
            title: "Proceed with Operation?",
            message:
              "Backup downloaded. Do you want to proceed with the operation?",
            confirmLabel: "Proceed",
            cancelLabel: "Cancel",
            variant: "default",
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
          });
        }, 500);
      },
      onCancel: () => {
        // User declined backup, ask if they still want to proceed
        showModal({
          title: "Proceed Without Backup?",
          message: "Are you sure you want to proceed without a backup?",
          confirmLabel: "Proceed Anyway",
          cancelLabel: "Cancel",
          variant: "destructive",
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      },
    });
  });
};
