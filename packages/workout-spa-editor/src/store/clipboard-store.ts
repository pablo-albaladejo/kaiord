/**
 * Clipboard store with in-memory fallback.
 *
 * Tries native navigator.clipboard API first, falls back to
 * in-memory storage when permissions are denied (Firefox, WebKit,
 * mobile browsers, insecure contexts).
 */

let memory: string | null = null;

export const writeClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    memory = text;
  }
};

export const readClipboard = async (): Promise<string> => {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return memory ?? "";
  }
};
