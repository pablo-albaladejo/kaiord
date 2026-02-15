/**
 * Clipboard store with in-memory fallback.
 *
 * Tries native navigator.clipboard API first, falls back to
 * in-memory storage when permissions are denied or the API
 * hangs (Firefox, WebKit, mobile browsers, insecure contexts).
 */

const CLIPBOARD_TIMEOUT_MS = 1000;

let memory: string | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

export const writeClipboard = async (text: string): Promise<void> => {
  memory = text;
  try {
    await withTimeout(navigator.clipboard.writeText(text), CLIPBOARD_TIMEOUT_MS);
  } catch {
    // Fallback already stored in memory
  }
};

export const readClipboard = async (): Promise<string> => {
  try {
    return await withTimeout(
      navigator.clipboard.readText(),
      CLIPBOARD_TIMEOUT_MS
    );
  } catch {
    return memory ?? "";
  }
};
