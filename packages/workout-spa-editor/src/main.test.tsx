import "fake-indexeddb/auto";

import Dexie from "dexie";
import { describe, expect, it, vi } from "vitest";

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
  it("should not open the database from module scope when the schema is stale", async () => {
    // Arrange
    await installNewerDatabase();
    document.body.innerHTML = '<div id="root"></div>';
    const dexieOpen = vi.spyOn(Dexie.prototype, "open");
    const idbOpen = vi.spyOn(indexedDB, "open");

    // Act
    await import("./main");
    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1));
    const { db } = await import("./adapters/dexie/dexie-database");

    // Assert
    // The probe's own versionless open is the only one.
    const appOpens = idbOpen.mock.calls.filter(([name]) => name === APP_DB);
    expect(appOpens).toEqual([[APP_DB]]);
    expect(dexieOpen).not.toHaveBeenCalled();
    expect(db.isOpen()).toBe(false);
  });
});
