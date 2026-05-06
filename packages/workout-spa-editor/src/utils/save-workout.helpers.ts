/**
 * Save Workout Helpers
 *
 * Pure helpers for the KRD save pipeline (filename sanitization, browser
 * download trigger). Co-located with `save-workout.ts` but split out so
 * the orchestrator stays under the per-file line cap.
 */

/** Trigger browser download of file. */
export const triggerDownload = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: "application/vnd.kaiord+json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** Sanitize filename for safe file system usage. */
export const sanitizeFilename = (name: string): string => {
  return (
    name
      .replace(/[^a-z0-9_-]/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .toLowerCase()
      .slice(0, 50) || "workout"
  );
};
