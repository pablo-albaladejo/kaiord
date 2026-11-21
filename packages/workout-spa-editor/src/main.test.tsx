import "fake-indexeddb/auto";

import Dexie from "dexie";
import { beforeAll, describe, expect, it, vi } from "vitest";

const render = vi.fn();
vi.mock("react-dom/client", () => ({
  createRoot: () => ({ render, unmount: vi.fn() }),
}));

const NATIVE_STALE = 380;
const APP_DB = "kaiord-spa";

const installNewerDatabase = (): Promise<void> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(APP_DB, NATIVE_STALE);
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });

describe("main boot order", () => {
  let appOpens: unknown[][];
  let dexieOpens: number;

  // Booting main transforms the whole app graph on a cold cache, so it runs
  // here, outside the test. Vitest clears mock calls before each test, so
  // the boot's calls are captured before this hook returns.
  beforeAll(async () => {
    await installNewerDatabase();
    document.body.innerHTML = '<div id="root"></div>';
    const dexieOpen = vi.spyOn(Dexie.prototype, "open");
    const idbOpen = vi.spyOn(indexedDB, "open");
    await import("./main");
    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1));
    appOpens = idbOpen.mock.calls.filter(([name]) => name === APP_DB);
    dexieOpens = dexieOpen.mock.calls.length;
  });

  it("should not open the database from module scope when the schema is stale", async () => {
    // Arrange
    const { db } = await import("./adapters/dexie/dexie-database");

    // Act
    const isOpen = db.isOpen();

    // Assert
    // The probe's own versionless open is the only one.
    expect(appOpens).toEqual([[APP_DB]]);
    expect(dexieOpens).toBe(0);
    expect(isOpen).toBe(false);
  });
});
