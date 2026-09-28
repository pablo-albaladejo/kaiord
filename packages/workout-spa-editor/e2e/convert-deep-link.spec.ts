/**
 * Converter deep link: `/app/#/convert?from=<fmt>&to=<fmt>` is what every
 * docs converter page links to. It must work cold (a fresh visitor from a
 * search result), convert with the pair preselected, report the same
 * `workout-imported` / `workout-exported` events as the editor, and stay
 * isolated from the editor: nothing is persisted and the workout open in
 * the editor is left untouched.
 *
 * Umami is stubbed before any app code runs; each tracked event is appended
 * to sessionStorage, so the record survives the document reloads `goto`
 * performs.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { clearDexie, makeWorkout, seedWorkouts } from "./helpers/seed-dexie";

const EVENTS_KEY = "__E2E_UMAMI_EVENTS__";
const fixture = (path: string) =>
  readFileSync(
    fileURLToPath(new URL(`../../../test-fixtures/${path}`, import.meta.url))
  );

type TrackedEvent = { name: string; data?: { format?: string } };

async function stubUmami(page: Page) {
  await page.route("**/cloud.umami.is/script.js", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" })
  );
  await page.addInitScript((key: string) => {
    const w = window as unknown as Record<string, unknown>;
    w.__KAIORD_CONFIG__ = { umamiWebsiteId: "e2e-convert" };
    w.umami = {
      track: (name: unknown, data?: unknown) => {
        if (typeof name !== "string") return;
        const events = JSON.parse(sessionStorage.getItem(key) ?? "[]");
        events.push({ name, data });
        sessionStorage.setItem(key, JSON.stringify(events));
      },
    };
  }, EVENTS_KEY);
}

const trackedEvents = (page: Page): Promise<TrackedEvent[]> =>
  page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key) ?? "[]"),
    EVENTS_KEY
  );

async function uploadAndDownload(page: Page, name: string, buffer: Buffer) {
  await page.getByTestId("file-upload-input").setInputFiles({
    name,
    mimeType: "application/octet-stream",
    buffer,
  });
  const download = page.waitForEvent("download");
  await page.getByTestId("convert-download").click();
  return (await download).suggestedFilename();
}

type Counts = { workouts: number; templates: number };

const dexieCounts = (page: Page): Promise<Counts> =>
  page.evaluate(async () => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as {
      table: (n: string) => { count: () => Promise<number> };
    };
    return {
      workouts: await db.table("workouts").count(),
      templates: await db.table("templates").count(),
    };
  });

const storedKrd = (page: Page, id: string): Promise<unknown> =>
  page.evaluate(async (workoutId) => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as {
      table: (n: string) => { get: (k: string) => Promise<{ krd: unknown }> };
    };
    return (await db.table("workouts").get(workoutId)).krd;
  }, id);

test.describe("Converter deep link", () => {
  test("should convert a FIT file to TCX on a cold visit and report both events", async ({
    page,
  }) => {
    // Arrange
    await stubUmami(page);
    await page.goto("/convert?from=fit&to=tcx");
    await expect(
      page.getByRole("heading", { name: "Convert FIT to TCX" })
    ).toBeVisible();

    // Act
    const filename = await uploadAndDownload(
      page,
      "WorkoutIndividualSteps.fit",
      fixture("fit/WorkoutIndividualSteps.fit")
    );

    // Assert
    expect(filename).toMatch(/\.tcx$/);
    await expect
      .poll(async () => (await trackedEvents(page)).map((e) => e.name))
      .toEqual(
        expect.arrayContaining(["workout-imported", "workout-exported"])
      );
    const events = await trackedEvents(page);
    expect(events.find((e) => e.name === "workout-imported")?.data).toEqual({
      format: "fit",
    });
    expect(events.find((e) => e.name === "workout-exported")?.data).toEqual({
      format: "tcx",
    });
  });

  test("should leave the open workout and the stored data untouched", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/calendar");
    await clearDexie(page);
    const workout = makeWorkout({ sport: "cycling" });
    await seedWorkouts(page, [workout]);
    await page.goto(`/workout/${workout.id}`);
    await expect(page.locator("[data-route-heading]")).toBeAttached();
    const before = {
      counts: await dexieCounts(page),
      krd: await storedKrd(page, workout.id),
    };
    const storeName = () =>
      page.evaluate(() => {
        const w = window as unknown as Record<string, unknown>;
        const store = w.__KAIORD_WORKOUT_STORE__ as {
          getState: () => { currentWorkout: unknown };
        };
        // Step ids are minted on every load into the store; compare content.
        return JSON.stringify(store.getState().currentWorkout, (key, value) =>
          key === "id" ? undefined : value
        );
      });
    const openWorkout = await storeName();

    // Act — same-document navigation: the editor store stays alive.
    await page.evaluate(() => {
      window.location.hash = "#/convert?from=zwo&to=fit";
    });
    const filename = await uploadAndDownload(
      page,
      "WorkoutIndividualSteps.zwo",
      fixture("zwo/WorkoutIndividualSteps.zwo")
    );
    const storeWhileConverting = await storeName();
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`#/workout/${workout.id}$`));

    // Assert
    expect(filename).toMatch(/\.fit$/);
    expect(storeWhileConverting).toBe(openWorkout);
    expect(await storeName()).toBe(openWorkout);
    expect(await dexieCounts(page)).toEqual(before.counts);
    expect(await storedKrd(page, workout.id)).toEqual(before.krd);
  });

  test("should show the format picker for an unknown format", async ({
    page,
  }) => {
    // Arrange
    const url = "/convert?from=bogus&to=fit";

    // Act
    await page.goto(url);

    // Assert
    await expect(page.getByTestId("convert-format-picker")).toBeVisible();
    await expect(page).toHaveURL(/#\/convert\?from=bogus/);
  });
});
