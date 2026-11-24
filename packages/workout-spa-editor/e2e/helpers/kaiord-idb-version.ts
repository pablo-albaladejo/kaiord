import type { Page } from "@playwright/test";

/**
 * The installed native version of `kaiord-spa`, for production-bundle specs
 * that simulate a newer deploy. Opened the way `kaiord-idb.ts` opens it: it
 * aborts on `oldVersion 0` (never creates the database) and closes at once
 * (never blocks the app's upgrade). Throws while the database is absent.
 */

type Outcome =
  | { status: "ok"; version: number }
  | { status: "absent" }
  | { status: "error"; reason: string };

// Dexie stores each declared version as native `verno * 10`.
const NATIVE_PER_VERNO = 10;

export const kaiordNativeVersion = async (page: Page): Promise<number> => {
  const outcome = await page.evaluate(
    () =>
      new Promise<Outcome>((resolve) => {
        const open = indexedDB.open("kaiord-spa");
        open.onupgradeneeded = (event) => {
          if (event.oldVersion === 0) open.transaction?.abort();
        };
        open.onerror = (event) => {
          event.preventDefault();
          const name = open.error?.name;
          resolve(
            name === "AbortError"
              ? { status: "absent" }
              : { status: "error", reason: `open: ${name}` }
          );
        };
        open.onsuccess = () => {
          const { version } = open.result;
          open.result.close();
          resolve({ status: "ok", version });
        };
      })
  );
  if (outcome.status === "ok") return outcome.version;
  const why = outcome.status === "absent" ? "no database" : outcome.reason;
  throw new Error(`kaiord-spa version: ${why}`);
};

/** The native version the next major schema, from a newer deploy, installs. */
export const nextMajorNative = (installed: number): number =>
  (Math.floor(installed / NATIVE_PER_VERNO) + 1) * NATIVE_PER_VERNO;
