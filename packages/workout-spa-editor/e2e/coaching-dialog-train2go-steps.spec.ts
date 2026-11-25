/* eslint-disable no-magic-numbers -- a steps table is literal durations, watts and bpm, clearer inline */
/**
 * E2E: a Train2Go session that comes with its steps table converts from the
 * table, without the AI (#1684).
 *
 * The activity is seeded as the Train2Go Connector stores it after the
 * daily read: description plus `structuredSteps` (synthetic, invented
 * values). A provider is configured and every LLM endpoint is routed, so a
 * call to the AI would be seen; the assertion is that none is made and the
 * stored workout holds the table's steps and repeat.
 */
import type { Page, Route } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { seedAiProvider } from "./helpers/seed-ai-provider";
import { clearDexie, getWeekDates, getWeekId } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const PROFILE_ID = "t2g-steps-profile";
const SOURCE = "train2go";
const SOURCE_ID = "t2g-steps-1";

const row = (durationSeconds: number, zone: string) => ({
  durationSeconds,
  zone,
  powerWatts: { min: 100, max: 140 },
  heartRateBpm: { min: 110, max: 125 },
});
const STEPS = [
  { repeat: 1, steps: [row(600, "R0")] },
  { repeat: 4, steps: [row(120, "R1"), row(60, "R0")] },
  { repeat: 1, steps: [row(300, "R0")] },
];

type Db = {
  table: (n: string) => {
    put: (r: unknown) => Promise<unknown>;
    toArray: () => Promise<Record<string, unknown>[]>;
  };
};

const seed = async (page: Page, day: string, ts: string) => {
  await page.evaluate(
    async ({ profileId, source, sourceId, day, ts, steps }) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as Db;
      await db.table("profiles").put({
        id: profileId,
        name: "Steps profile",
        sportZones: {},
        linkedAccounts: [{ source, externalId: "t2g-acct-1" }],
        createdAt: ts,
        updatedAt: ts,
      });
      await db.table("meta").put({ key: "activeProfileId", value: profileId });
      // Out-of-week dummy so the first-run guide does not render.
      await db.table("workouts").put({
        id: "steps-dummy-out-of-week",
        profileId,
        date: "2020-01-01",
        state: "raw",
        sport: "cycling",
        source: "manual",
        sourceId: "dummy",
        planId: null,
        raw: { description: "x", duration: { value: 600, unit: "s" } },
        krd: null,
        lastProcessingError: null,
        feedback: null,
        aiMeta: null,
        garminPushId: null,
        tags: [],
        previousState: null,
        createdAt: ts,
        modifiedAt: null,
        updatedAt: ts,
      });
      await db.table("coachingActivities").put({
        id: `${profileId}:${source}:${sourceId}`,
        profileId,
        source,
        sourceId,
        date: day,
        sport: "cycling",
        title: "Rodaje con tabla",
        status: "pending",
        description: "Rodaje siguiendo las zonas de potencia.",
        structuredSteps: steps,
        duration: "36 min",
        fetchedAt: ts,
      });
    },
    {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: SOURCE_ID,
      day,
      ts,
      steps: STEPS,
    }
  );
};

test.describe("Train2Go session with a steps table", () => {
  test("converts from the table without calling the AI", async ({ page }) => {
    // Arrange
    await page.goto("/calendar");
    await waitForDexieReady(page);
    await clearDexie(page);
    let llmCalls = 0;
    const countLlm = async (route: Route) => {
      llmCalls += 1;
      await route.abort();
    };
    await page.route("**/api.anthropic.com/**", countLlm);
    await page.route("**/api.openai.com/**", countLlm);
    await page.route("**/generativelanguage.googleapis.com/**", countLlm);
    await seedAiProvider(page);
    const day = getWeekDates(0)[2];
    await seed(page, day, new Date(day + "T08:00:00Z").toISOString());

    // Act
    await page.goto(`/calendar/${getWeekId(day)}`);
    const card = page.getByTestId(`coaching-card-${SOURCE}:${SOURCE_ID}`);
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    await expect(page.getByTestId("coaching-activity-dialog")).toBeVisible();
    await page.getByTestId("coaching-dialog-ai-process").click();

    // Assert
    await expect(page).toHaveURL(/\/workout\//, { timeout: 15_000 });
    const stored = await page.evaluate(async (profileId) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as Db;
      const all = await db.table("workouts").toArray();
      return all.filter(
        (w) => w.profileId === profileId && w.state === "structured"
      );
    }, PROFILE_ID);
    expect(llmCalls).toBe(0);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.aiMeta).toBeNull();
    const krd = stored[0]?.krd as {
      extensions: { structured_workout: { steps: Record<string, unknown>[] } };
    };
    const steps = krd.extensions.structured_workout.steps;
    expect(steps).toHaveLength(3);
    expect(steps[1]).toMatchObject({ repeatCount: 4 });
    expect(steps[0]).toMatchObject({
      name: "R0",
      duration: { type: "time", seconds: 600 },
      target: { type: "power", value: { unit: "range", min: 100, max: 140 } },
      notes: "HR 110-125 bpm",
    });
  });
});
