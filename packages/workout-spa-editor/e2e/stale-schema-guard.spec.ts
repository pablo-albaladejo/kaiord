/**
 * E2E: a tab whose code is older than the installed database stops.
 *
 * A newer deploy upgrades `kaiord-spa` to the next major (native version
 * `verno * 10`). The running tab must close its connection and block
 * mid-session, and a reload of the old code must block at boot: in both, the
 * database stays at the newer version (no schema patch by old code) and the
 * app's Dexie instance is never open. The saved rows stay untouched for the
 * newer build. Real IndexedDB only: fake-indexeddb cannot show this.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

type DevDb = { isOpen: () => boolean };

// Dexie stores each declared version as native `verno * 10`.
const NATIVE_PER_VERNO = 10;

// Only called once the app has created the database, so a version-less open
// never creates it here.
const nativeVersion = (page: Page): Promise<number> =>
  page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const request = indexedDB.open("kaiord-spa");
        request.onsuccess = () => {
          const version = request.result.version;
          request.result.close();
          resolve(version);
        };
        request.onerror = () => reject(request.error);
      })
  );

// What a newer deploy does: open at the next major, adding a store.
const upgradeFromNewerDeploy = (page: Page, version: number): Promise<void> =>
  page.evaluate(
    (version) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("kaiord-spa", version);
        request.onupgradeneeded = () =>
          request.result.createObjectStore("fromNewerDeploy");
        request.onsuccess = () => {
          request.result.close();
          resolve();
        };
        request.onerror = () => reject(request.error);
      }),
    version
  );

const appDbIsOpen = (page: Page): Promise<boolean> =>
  page.evaluate(() =>
    (window as unknown as { __KAIORD_DB__: DevDb }).__KAIORD_DB__.isOpen()
  );

test.describe("Stale schema guard", () => {
  test.afterEach(async ({ page }) => {
    // Leave nothing at a version this build cannot open.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const request = indexedDB.deleteDatabase("kaiord-spa");
          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
          request.onblocked = () => resolve();
        })
    );
  });

  test("should stop a tab mid-session and at boot without touching the newer database", async ({
    page,
  }) => {
    // Arrange
    await page.goto("./");
    await waitForDexieReady(page);
    const installed = await nativeVersion(page);
    const newer =
      (Math.floor(installed / NATIVE_PER_VERNO) + 1) * NATIVE_PER_VERNO;

    // Act
    await upgradeFromNewerDeploy(page, newer);

    // Assert
    await expect(page.getByTestId("stale-schema-dialog")).toBeVisible();
    expect(await appDbIsOpen(page)).toBe(false);

    // Act
    await page.reload();

    // Assert
    await expect(page.getByTestId("stale-schema-dialog")).toBeVisible();
    expect(await appDbIsOpen(page)).toBe(false);
    expect(await nativeVersion(page)).toBe(newer);
  });
});
