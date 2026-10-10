/**
 * FIT import through the production bundle.
 *
 * The dev server pre-bundles `@garmin/fitsdk`, so a build-time rewrite of the
 * SDK (the profile trim that broke every FIT import on kaiord.com/app with
 * "Cannot read properties of undefined (reading 'DEVELOPER_DATA_ID')") was
 * invisible to every spec that runs against `pnpm dev`. These specs import
 * real FIT files through the UI of the built artifact, served the way the
 * static host serves it, so whatever the build does to the FIT SDK is what
 * gets exercised.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  APP_BASE,
  type MergedDist,
  startMergedDist,
} from "./fixtures/merged-dist-server";

const ENABLED = process.env.E2E_PROD_BASE === "1";
const IMPORT_TIMEOUT_MS = 15_000;
const FIT_CHUNK = new RegExp(`${APP_BASE}assets/kaiord-fit-[\\w-]+\\.js$`);

// WorkoutRepeatSteps.fit: warm-up, a 3x block of two steps, cool-down.
const REPEAT_WORKOUT = { file: "WorkoutRepeatSteps.fit", steps: 4, blocks: 1 };
// WorkoutIndividualSteps.fit: four plain steps.
const PLAIN_WORKOUT = { file: "WorkoutIndividualSteps.fit", steps: 4 };
// Activity.fit: a recorded activity (session, lap, records) from 2021-07-20.
// The `date` query is what makes the import persist it as an activity row.
const ACTIVITY = { file: "Activity.fit", date: "2021-07-20" };

const fixture = (name: string): Buffer =>
  readFileSync(
    fileURLToPath(
      new URL(`../../../test-fixtures/fit/${name}`, import.meta.url)
    )
  );

/** Every successful response for the lazily loaded `@kaiord/fit` chunk. */
function fitChunkRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("response", (response) => {
    const { pathname } = new URL(response.url());
    if (FIT_CHUNK.test(pathname) && response.ok()) urls.push(pathname);
  });
  return urls;
}

async function uploadFit(
  page: Page,
  dist: MergedDist,
  file: { name: string; buffer: Buffer }
): Promise<void> {
  await page.goto(dist.routeUrl("/workout/new?action=import"));
  await page.getByTestId("file-upload-input").setInputFiles({
    name: file.name,
    mimeType: "application/octet-stream",
    buffer: file.buffer,
  });
}

/**
 * Waits until `imported` holds or the upload shows its error. On failure the
 * assertion reports the on-screen error ("…reading 'DEVELOPER_DATA_ID'"),
 * not a bare timeout.
 */
async function expectImported(
  page: Page,
  imported: () => Promise<boolean>
): Promise<void> {
  const error = page.getByRole("alert").filter({ hasText: /import failed/i });
  await expect
    .poll(
      async () => {
        if (await error.count()) return await error.first().innerText();
        return (await imported()) ? "imported" : "pending";
      },
      { timeout: IMPORT_TIMEOUT_MS }
    )
    .toBe("imported");
}

const hasStepCards = (page: Page, steps: number) => async () =>
  (await page.getByTestId("step-card").count()) === steps;

/** Health imports are filed under the active profile. */
async function createProfile(page: Page, dist: MergedDist): Promise<void> {
  await page.goto(dist.routeUrl("/athlete"));
  await page.getByRole("button", { name: "Create profile" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("FIT import athlete");
  await page.getByRole("button", { name: "Create Profile" }).click();
  // The first profile is activated on creation.
  await expect(
    page.getByRole("heading", { name: "Saved Profiles (1)" })
  ).toBeVisible({ timeout: IMPORT_TIMEOUT_MS });
}

/** Row count of an IndexedDB store, read without the app's dev-only hooks. */
const storeCount = (page: Page, store: string): Promise<number> =>
  page.evaluate(
    (name) =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open("kaiord-spa");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const count = db.transaction(name).objectStore(name).count();
          count.onerror = () => reject(count.error);
          count.onsuccess = () => {
            db.close();
            resolve(count.result);
          };
        };
      }),
    store
  );

test.describe("@prod-bundle FIT import on the production bundle", () => {
  test.skip(!ENABLED, "Production-base e2e gated behind E2E_PROD_BASE=1");

  let dist: MergedDist;

  test.beforeAll(async () => {
    dist = await startMergedDist("fit-import");
  });

  test.afterAll(async () => {
    if (dist) await dist.close();
  });

  test("should import a structured workout FIT with its repeat block", async ({
    page,
  }) => {
    // Arrange
    const fitChunk = fitChunkRequests(page);
    const { file, steps, blocks } = REPEAT_WORKOUT;

    // Act
    await uploadFit(page, dist, { name: file, buffer: fixture(file) });

    // Assert
    await expectImported(page, hasStepCards(page, steps));
    await expect(page.getByTestId("repetition-block-card")).toHaveCount(blocks);
    expect(fitChunk.length).toBeGreaterThan(0);
  });

  test("should re-import a FIT the app itself exported", async ({ page }) => {
    // Arrange
    const { file, steps } = PLAIN_WORKOUT;
    await uploadFit(page, dist, { name: file, buffer: fixture(file) });
    await expectImported(page, hasStepCards(page, steps));
    await page.getByTestId("export-format-selector-button").click();
    await page.getByTestId("export-format-option-fit").click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /download a file/i }).click();
    const exported = readFileSync(await (await download).path());

    // Act
    await uploadFit(page, dist, { name: "exported.fit", buffer: exported });

    // Assert
    await expectImported(page, hasStepCards(page, steps));
  });

  for (const health of [
    { file: "HealthHrvOvernight.fit", store: "healthHrv", route: "recovery" },
    {
      file: "WeightScaleMultiUser.fit",
      store: "healthWeight",
      route: "weight",
    },
  ]) {
    test(`should store the ${health.store} row from ${health.file}`, async ({
      page,
    }) => {
      // Arrange
      await createProfile(page, dist);
      const file = { name: health.file, buffer: fixture(health.file) };

      // Act
      await uploadFit(page, dist, file);

      // Assert
      await expectImported(page, async () =>
        new URL(page.url()).hash.startsWith(`#/health/${health.route}`)
      );
      expect(await storeCount(page, health.store)).toBe(1);
    });
  }

  test("should store the activity row from Activity.fit", async ({ page }) => {
    // Arrange
    await createProfile(page, dist);
    await page.goto(
      dist.routeUrl(`/workout/new?action=import&date=${ACTIVITY.date}`)
    );

    // Act
    await page.getByTestId("file-upload-input").setInputFiles({
      name: ACTIVITY.file,
      mimeType: "application/octet-stream",
      buffer: fixture(ACTIVITY.file),
    });

    // Assert
    await expectImported(page, async () =>
      new URL(page.url()).hash.startsWith("#/calendar")
    );
    expect(await storeCount(page, "activities")).toBe(1);
  });
});
