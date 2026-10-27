import type { Page } from "@playwright/test";

/**
 * Raw IndexedDB access to the app's `kaiord-spa` database, for specs that run
 * on the production bundle and so have no `window.__KAIORD_DB__` hook.
 *
 * A version-less `indexedDB.open` on a database that does not exist yet
 * CREATES it, empty, at version 1. A spec can get there before the app does
 * (WebKit fires `load` first); the store lookup then throws inside
 * `onsuccess`, a connection that ignores `versionchange` leaves the app's own
 * open `blocked`, and every later open queues behind it. So every access here:
 * - aborts the upgrade on `oldVersion === 0`, which leaves no database behind
 *   (Chromium, Firefox and WebKit agree), and reports the database as absent;
 * - closes on `versionchange`, so it can never block the app's upgrade;
 * - closes on every path, including a throwing store lookup.
 *
 * Absent never reads as empty. `pollKaiordStore` returns `undefined` for it,
 * so a poll keeps going and no `toEqual([])` passes on a database that does
 * not exist; every other accessor throws. (`expect.poll` evaluates its
 * callback outside its retry, so a throw there ends the poll at once.)
 */

type Op =
  | { kind: "getAll"; store: string }
  | { kind: "count"; store: string }
  | { kind: "put"; store: string; rows: unknown[] };

type Outcome =
  | { status: "ok"; value: unknown }
  | { status: "absent" }
  | { status: "error"; reason: string };

const access = (page: Page, op: Op): Promise<Outcome> =>
  page.evaluate(
    (op) =>
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
          const db = open.result;
          db.onversionchange = () => db.close();
          const done = (outcome: Outcome) => {
            db.close();
            resolve(outcome);
          };
          const fail = (reason: string) => done({ status: "error", reason });
          try {
            const mode = op.kind === "put" ? "readwrite" : "readonly";
            const tx = db.transaction(op.store, mode);
            const store = tx.objectStore(op.store);
            if (op.kind === "put") {
              for (const row of op.rows) store.put(row);
              tx.oncomplete = () =>
                done({ status: "ok", value: op.rows.length });
              tx.onerror = () => fail(`${tx.error?.name}`);
              return;
            }
            const req = op.kind === "count" ? store.count() : store.getAll();
            req.onsuccess = () => done({ status: "ok", value: req.result });
            req.onerror = () => fail(`${req.error?.name}`);
          } catch (error) {
            fail(`${(error as Error).name}`);
          }
        };
      }),
    op
  );

const unwrap = (op: Op, outcome: Outcome): unknown => {
  if (outcome.status === "ok") return outcome.value;
  const why = outcome.status === "absent" ? "no database" : outcome.reason;
  throw new Error(`kaiord-spa ${op.kind} ${op.store}: ${why}`);
};

const required = async (page: Page, op: Op): Promise<unknown> =>
  unwrap(op, await access(page, op));

/** Rows of a store, or `undefined` while the app has not created the database. */
export const pollKaiordStore = async <T>(
  page: Page,
  store: string
): Promise<T[] | undefined> => {
  const op: Op = { kind: "getAll", store };
  const outcome = await access(page, op);
  return outcome.status === "absent" ? undefined : (unwrap(op, outcome) as T[]);
};

export const readKaiordStore = <T>(page: Page, store: string): Promise<T[]> =>
  required(page, { kind: "getAll", store }) as Promise<T[]>;

export const countKaiordStore = (page: Page, store: string): Promise<number> =>
  required(page, { kind: "count", store }) as Promise<number>;

export const putKaiordRows = (
  page: Page,
  store: string,
  rows: unknown[]
): Promise<number> =>
  required(page, { kind: "put", store, rows }) as Promise<number>;
