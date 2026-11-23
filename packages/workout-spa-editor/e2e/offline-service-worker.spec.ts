/**
 * The Kaiord App's service worker, over the tree the deploy assembles
 * (`scripts/assemble-site.mjs`, which emits `app/sw.js` last) and served the
 * way Pages serves it. Every other spec blocks service workers; this one
 * allows them. A re-assembly into the same served tree stands in for the
 * next deploy.
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  type MergedDist,
  startMergedDist,
} from "./fixtures/merged-dist-server";
import { workoutCardsOn } from "./helpers/calendar-day";
import { toLocalDateString } from "./helpers/local-date";
import {
  cacheNames,
  cacheOf,
  checkForUpdate,
  hasRegistration,
  isControlled,
  isSameDocument,
  markDocument,
  nextBuild,
  reloadsOn,
  staleShellAtTheEdge,
  takeControl,
} from "./helpers/service-worker";

const ENABLED = process.env.E2E_PROD_BASE === "1";
const BOOT_TIMEOUT_MS = 15_000;
const INSTALL_TIMEOUT_MS = 45_000;
const TEST_TIMEOUT_MS = 120_000;
// Time for a failed install to settle, and for a reloaded page to register.
const INSTALL_SETTLE_MS = 3_000;
const REREGISTER_MS = 5_000;
// A deploy found this soon after load, with nothing done, applies silently.
const SILENT_WINDOW_MS = 10_000;
// Native IndexedDB version of the next major schema (Dexie stores verno * 10).
const NEXT_MAJOR_NATIVE = 390;
// The lazy route chunk a later deploy no longer ships.
const SETTINGS_CHUNK = /^SettingsPage-[\w-]+\.js$/;

const openRoute = async (page: Page, route: string, testId: string) => {
  await page.evaluate((hash) => {
    window.location.hash = hash;
  }, `#${route}`);
  await expect(page.getByTestId(testId)).toBeVisible({
    timeout: BOOT_TIMEOUT_MS,
  });
};

async function scheduleAndEdit(page: Page) {
  const today = toLocalDateString(new Date());
  await openRoute(
    page,
    `/workout/new?source=scratch&date=${today}`,
    "add-first-step-button"
  );
  await page.getByTestId("add-first-step-button").click();
  await page.getByTestId("scratch-schedule-button").click();
  await workoutCardsOn(page, today).click();
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByTestId("add-step-button").click();
  await expect(page.getByTestId("editor-unsaved")).toBeVisible();
}

// A workout as an athlete would drop it from the desktop: one KRD file.
const DROPPED_WORKOUT = {
  name: "dropped.krd",
  mimeType: "application/json",
  buffer: Buffer.from(
    JSON.stringify({
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2026-01-01T00:00:00Z", sport: "running" },
      extensions: {
        structured_workout: {
          name: "Dropped Tempo",
          sport: "running",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 600 },
              targetType: "open",
              target: { type: "open" },
              intensity: "active",
            },
          ],
        },
      },
    })
  ),
};

/** A drop from the desktop: drag events, then the file lands in the input. */
async function dropWorkout(page: Page) {
  const input = page.getByTestId("file-upload-input");
  for (const type of ["dragenter", "dragover", "drop"]) {
    await input.dispatchEvent(type);
  }
  await input.setInputFiles(DROPPED_WORKOUT);
}

/** Counts this page's document loads from now on. */
function countLoads(page: Page): () => number {
  let loads = 0;
  page.on("load", () => {
    loads += 1;
  });
  return () => loads;
}

test.describe("@service-worker the App's service worker", () => {
  test.skip(!ENABLED, "Production-base e2e gated behind E2E_PROD_BASE=1");
  test.use({ serviceWorkers: "allow" });
  test.setTimeout(TEST_TIMEOUT_MS);

  let dist: MergedDist;

  test.beforeAll(async () => {
    dist = await startMergedDist("service-worker");
  });

  test.afterAll(async () => {
    if (dist) await dist.close();
  });

  // Each test may deploy again; the next one starts from the first build.
  test.afterEach(() => dist.reassemble());

  test("should open the Day, then the Calendar and Settings never opened online, with no network", async ({
    page,
    context,
  }) => {
    // Arrange
    await takeControl(page, dist.routeUrl("/daily"));
    await context.setOffline(true);

    // Act
    await page.reload();

    // Assert
    await expect(page.getByTestId("daily-page")).toBeVisible({
      timeout: BOOT_TIMEOUT_MS,
    });
    await openRoute(page, "/calendar", "calendar-page");
    await openRoute(page, "/settings", "settings-page");
    expect(await isControlled(page)).toBe(true);
  });

  test("should leave the landing uncontrolled and cache nothing outside the precache", async ({
    page,
    context,
  }) => {
    // Arrange
    await takeControl(page, dist.routeUrl("/daily"));
    const passedThrough = await page.evaluate(async () => {
      const statuses = [];
      for (const path of ["/mcp", "/a2a", "/app/version.json"]) {
        statuses.push((await fetch(path)).status);
      }
      return statuses;
    });
    await context.setOffline(true);

    // Act
    const offline = await page.evaluate(async () => {
      const outcomes = [];
      for (const path of ["/mcp", "/a2a", "/app/version.json"]) {
        const fetched = fetch(path, { cache: "no-store" });
        outcomes.push(
          await fetched.then(
            () => "served",
            () => "network"
          )
        );
      }
      return outcomes;
    });
    const cached = await page.evaluate(async () => {
      const paths = [];
      for (const name of await caches.keys()) {
        for (const request of await (await caches.open(name)).keys()) {
          paths.push(new URL(request.url).pathname);
        }
      }
      return paths;
    });
    await context.setOffline(false);
    await page.goto(`${dist.server.url}/no-such-page`);

    // Assert
    expect(passedThrough).toEqual([404, 404, 200]);
    expect(offline).toEqual(["network", "network", "network"]);
    expect(cached.length).toBeGreaterThan(0);
    expect(cached.filter((path) => !path.startsWith("/app/"))).toEqual([]);
    expect(cached).not.toContain("/app/version.json");
    expect(await isControlled(page)).toBe(false);
  });

  test("should prompt for a new deploy, hold it while edits are unsaved, and reload only the tab that asks", async ({
    page,
    context,
  }) => {
    // Arrange
    await takeControl(page, dist.routeUrl("/calendar"));
    const other = await context.newPage();
    await other.goto(dist.routeUrl("/daily"));
    await expect(other.getByTestId("daily-page")).toBeVisible();
    await scheduleAndEdit(page);
    await markDocument(page);
    await markDocument(other);
    dist.reassemble({ build: nextBuild("v2") });

    // Act
    await checkForUpdate(page);
    const prompt = page.getByTestId("update-prompt");
    await expect(prompt).toBeVisible({ timeout: INSTALL_TIMEOUT_MS });
    await prompt.getByRole("button", { name: "Reload" }).click();

    // Assert
    await expect(page.getByTestId("update-save-first")).toBeVisible();
    expect(await isSameDocument(page)).toBe(true);

    // Act
    await page.getByTestId("editor-save-button").click();
    await expect(page.getByTestId("editor-unsaved")).toBeHidden();
    await reloadsOn(page, () =>
      prompt.getByRole("button", { name: "Reload" }).click()
    );

    // Assert
    expect(await isSameDocument(page)).toBe(false);
    await expect(page.getByTestId("update-prompt")).toBeHidden();
    expect(await isSameDocument(other)).toBe(true);
    await openRoute(other, "/calendar", "calendar-page");
  });

  test("should not reload over a file dropped right after load, and hold the deploy while it is unsaved", async ({
    page,
  }) => {
    // Arrange
    await takeControl(page, dist.routeUrl("/workout/new?action=import"));
    const loads = countLoads(page);
    await markDocument(page);

    // Act
    await dropWorkout(page);
    dist.reassemble({ build: nextBuild("v2") });
    await checkForUpdate(page);
    const prompt = page.getByTestId("update-prompt");
    await expect(prompt).toBeVisible({ timeout: INSTALL_TIMEOUT_MS });
    const foundAfterMs = await page.evaluate(() => performance.now());
    await expect(page.getByText("Dropped Tempo")).toBeVisible();
    await prompt.getByRole("button", { name: "Reload" }).click();

    // Assert
    // Found inside the silent window, so only the drop kept it from applying.
    expect(foundAfterMs).toBeLessThan(SILENT_WINDOW_MS);
    await expect(page.getByTestId("update-save-first")).toBeVisible();
    expect(await isSameDocument(page)).toBe(true);
    expect(loads()).toBe(0);
    await expect(page.getByText("Dropped Tempo")).toBeVisible();
  });

  test("should hold a deploy while a new workout is not saved, and reload once it is scheduled", async ({
    page,
  }) => {
    // Arrange
    const today = toLocalDateString(new Date());
    await takeControl(
      page,
      dist.routeUrl(`/workout/new?source=scratch&date=${today}`)
    );
    await page.getByTestId("add-first-step-button").click();
    await markDocument(page);
    dist.reassemble({ build: nextBuild("v2") });

    // Act
    await checkForUpdate(page);
    const prompt = page.getByTestId("update-prompt");
    await expect(prompt).toBeVisible({ timeout: INSTALL_TIMEOUT_MS });
    await prompt.getByRole("button", { name: "Reload" }).click();

    // Assert
    await expect(page.getByTestId("update-save-first")).toBeVisible();
    expect(await isSameDocument(page)).toBe(true);

    // Act
    await page.getByTestId("scratch-schedule-button").click();
    await expect(page.getByTestId("calendar-page")).toBeVisible();
    await reloadsOn(page, () =>
      prompt.getByRole("button", { name: "Reload" }).click()
    );

    // Assert
    expect(await isSameDocument(page)).toBe(false);
    await expect(workoutCardsOn(page, today)).toHaveCount(1);
  });

  test("should keep an open window's version across two deploys that drop one of its chunks", async ({
    page,
    context,
  }) => {
    // Arrange
    await takeControl(page, dist.routeUrl("/daily"));
    await page.mouse.click(1, 1);
    await markDocument(page);
    const first = cacheOf(dist.site);
    const updater = await context.newPage();
    await updater.goto(dist.routeUrl("/daily"));
    await updater.mouse.click(1, 1);

    // Act
    for (const label of ["v2", "v3"]) {
      dist.reassemble({ build: nextBuild(label, SETTINGS_CHUNK) });
      await checkForUpdate(updater);
      const prompt = updater.getByTestId("update-prompt");
      await expect(prompt).toBeVisible({ timeout: INSTALL_TIMEOUT_MS });
      await reloadsOn(updater, () =>
        prompt.getByRole("button", { name: "Reload" }).click()
      );
      await expect(updater.getByTestId("daily-page")).toBeVisible();
    }

    // Assert
    const shipped = readdirSync(join(dist.site, "app/assets"));
    expect(shipped.filter((name) => SETTINGS_CHUNK.test(name))).toEqual([]);
    expect(await cacheNames(page)).toContain(first);
    await openRoute(page, "/settings", "settings-page");
    expect(await isSameDocument(page)).toBe(true);
  });

  test("should keep the running worker when the host serves other bytes than it lists", async ({
    page,
  }) => {
    // Arrange
    await takeControl(page, dist.routeUrl("/daily"));
    const running = cacheOf(dist.site);
    dist.reassemble({
      build: nextBuild("v2"),
      afterAssembly: staleShellAtTheEdge,
    });
    const next = cacheOf(dist.site);

    // Act
    await checkForUpdate(page);
    await page.waitForTimeout(INSTALL_SETTLE_MS);

    // Assert
    const names = await cacheNames(page);
    expect(names).toContain(running);
    expect(names).not.toContain(next);
    expect(
      await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration?.waiting ?? registration?.installing ?? null;
      })
    ).toBeNull();
    await expect(page.getByTestId("update-prompt")).toBeHidden();
  });

  test("should stop a tab whose database a newer version upgraded, and offer to try again", async ({
    page,
    context,
  }) => {
    // Arrange
    await takeControl(page, dist.routeUrl("/daily"));
    const newer = await context.newPage();
    await newer.goto(`${dist.server.url}/no-such-page`);

    // Act
    await newer.evaluate(
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
      NEXT_MAJOR_NATIVE
    );
    const dialog = page.getByTestId("stale-schema-dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Reload" }).click();

    // Assert
    await expect(page.getByTestId("stale-try-later")).toBeVisible({
      timeout: BOOT_TIMEOUT_MS,
    });
    expect(await isControlled(page)).toBe(true);
  });

  test("should remove itself under the kill switch, reloading the page exactly once", async ({
    page,
  }) => {
    // Arrange
    await takeControl(page, dist.routeUrl("/daily"));
    let navigations = 0;
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) navigations += 1;
    });
    dist.reassemble({ swKill: true });

    // Act
    await checkForUpdate(page).catch(() => undefined);

    // Assert
    await expect
      .poll(() => navigations, { timeout: INSTALL_TIMEOUT_MS })
      .toBe(1);
    await expect(page.getByTestId("daily-page")).toBeVisible({
      timeout: BOOT_TIMEOUT_MS,
    });
    // Long enough for the reloaded page to register the kill worker again.
    await page.waitForTimeout(REREGISTER_MS);
    await expect.poll(() => hasRegistration(page)).toBe(false);
    expect(await cacheNames(page)).toEqual([]);
    expect(navigations).toBe(1);
    // Chromium leaves the reloaded page uncontrolled at once; Firefox and
    // WebKit keep the dying worker (it has no fetch handler) as its
    // controller until the next load.
    await page.reload();
    await expect(page.getByTestId("daily-page")).toBeVisible({
      timeout: BOOT_TIMEOUT_MS,
    });
    expect(await isControlled(page)).toBe(false);
  });
});
