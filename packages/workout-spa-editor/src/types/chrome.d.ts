/**
 * Minimal Chrome Extension API types for SPA ↔ extension communication.
 * Only the subset used by garmin-store-actions.ts.
 */

declare namespace chrome {
  namespace runtime {
    const lastError: { message: string } | null | undefined;
    function sendMessage(
      extensionId: string,
      message: unknown,
      callback: (response: unknown) => void
    ): void;
  }
}
