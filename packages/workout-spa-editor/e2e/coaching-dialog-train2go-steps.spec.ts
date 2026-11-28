/* eslint-disable no-magic-numbers -- a steps table is literal durations, watts and bpm, clearer inline */
/**
 * E2E: a Train2Go Coaching Activity that comes with its steps table
 * converts from the table; the AI only writes the step notes.
 *
 * The activity is seeded as the Train2Go Connector stores it after the
 * daily read: description plus `structuredSteps` (synthetic, invented
 * values). Every LLM endpoint is routed, so every call to the AI is seen:
 * with a provider, the one call is the notes-only one, and the stored
 * workout holds the table's steps and repeat with the coach's cue before
 * each HR range. The dialog shows the coach's table before and after the
 * Workout is built. With an Athlete note, Regenerate has the AI build the
 * Workout and its notes change. With no provider configured at all, the
 * build and Regenerate still work and no AI is called.
 */
import type { Page, Route } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { LLM_CYCLING_RESPONSE } from "./fixtures/llm-responses";
import { fulfillLlm } from "./fixtures/llm-sse";
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

const CUE = "Rueda suave";
const NOTE = "quiero indicaciones de cadencia";
const AI_CUE = "Cadencia alta, sentado";

const message = (answer: unknown) => ({
  ...LLM_CYCLING_RESPONSE,
  content: [{ type: "text", text: JSON.stringify(answer) }],
});

/** The notes-only call: the coach's cue on the table's first step. */
const NOTES_ANSWER = message({
  notes: [{ step: 1, text: CUE, origin: "coach" }],
});

/** The AI's own build, its note following the Athlete note. */
const parserAnswer = (withNote: boolean) =>
  message({
    name: "Rodaje con tabla",
    sport: "cycling",
    steps: [
      {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 600 },
        targetType: "open",
        target: { type: "open" },
        intensity: "active",
        notes: withNote ? AI_CUE : CUE,
        noteOrigin: withNote ? "ai" : "coach",
      },
    ],
  });

const isNotesCall = (body: string) =>
  body.includes("You write the note each step");

/** `answer: false` aborts every call, so none could build a Workout. */
const routeLlm = async (page: Page, answer = false) => {
  const calls = { count: 0, bodies: [] as string[] };
  const countLlm = async (route: Route) => {
    calls.count += 1;
    const body = route.request().postData() ?? "";
    calls.bodies.push(body);
    if (!answer) return route.abort();
    await fulfillLlm(
      route,
      isNotesCall(body) ? NOTES_ANSWER : parserAnswer(body.includes(NOTE))
    );
  };
  await page.route("**/api.anthropic.com/**", countLlm);
  await page.route("**/api.openai.com/**", countLlm);
  await page.route("**/generativelanguage.googleapis.com/**", countLlm);
  return calls;
};

const storedStructured = (page: Page) =>
  page.evaluate(async (profileId) => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as Db;
    const all = await db.table("workouts").toArray();
    return all.filter(
      (w) => w.profileId === profileId && w.state === "structured"
    );
  }, PROFILE_ID);

test.describe("Train2Go Coaching Activity with a steps table", () => {
  test("shows the coach's table, takes the steps from it and asks the AI only for the notes", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/calendar");
    await waitForDexieReady(page);
    await clearDexie(page);
    const llm = await routeLlm(page, true);
    await seedAiProvider(page);
    const day = getWeekDates(0)[2];
    await seed(page, day, new Date(day + "T08:00:00Z").toISOString());

    // Act
    await page.goto(`/calendar/${getWeekId(day)}`);
    const card = page.getByTestId(`coaching-card-${SOURCE}:${SOURCE_ID}`);
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    const dialog = page.getByTestId("coaching-activity-dialog");
    await expect(dialog).toBeVisible();
    // The coach's table is shown next to the coach's text, as written.
    const table = dialog.getByTestId("coaching-dialog-steps");
    await expect(dialog).toContainText("Coach's steps");
    await expect(table.getByRole("row")).toHaveCount(1 + 1 + 1 + 2 + 1);
    await expect(table.getByTestId("coaching-dialog-steps-repeat")).toHaveText(
      "4 ×"
    );
    await expect(table.getByRole("row").nth(1)).toHaveText(
      "10 minR0100–140 W110–125 bpm"
    );
    await page.getByTestId("coaching-dialog-ai-process").click();

    // Assert
    await expect(page).toHaveURL(/\/workout\//, { timeout: 15_000 });
    const stored = await storedStructured(page);
    expect(llm.count).toBe(1);
    expect(isNotesCall(llm.bodies[0] ?? "")).toBe(true);
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
      notes: `${CUE} · HR 110-125 bpm`,
    });
    expect(steps[2]).toMatchObject({ notes: "HR 110-125 bpm" });

    // Once the Workout is built, the coach's table is still shown.
    await page.goto(`/calendar/${getWeekId(day)}`);
    await page.getByTestId(`matched-card-${SOURCE}:${SOURCE_ID}`).click();
    await expect(
      page
        .getByTestId("coaching-activity-dialog")
        .getByTestId("coaching-dialog-steps")
    ).toBeVisible();
  });

  test("lets the Athlete note change the step notes on Regenerate", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/calendar");
    await waitForDexieReady(page);
    await clearDexie(page);
    const llm = await routeLlm(page, true);
    await seedAiProvider(page);
    const day = getWeekDates(0)[2];
    await seed(page, day, new Date(day + "T08:00:00Z").toISOString());
    await page.goto(`/calendar/${getWeekId(day)}`);
    await page.getByTestId(`coaching-card-${SOURCE}:${SOURCE_ID}`).click();
    const dialog = page.getByTestId("coaching-activity-dialog");
    await dialog.getByTestId("coaching-dialog-ai-process").click();
    await expect(page).toHaveURL(/\/workout\//, { timeout: 15_000 });
    await expect(page.getByText(`${CUE} · HR 110-125 bpm`)).toBeVisible();
    await expect(page.getByTitle("Written by the AI")).toHaveCount(0);

    // Act
    await page.goto(`/calendar/${getWeekId(day)}`);
    await page.getByTestId(`matched-card-${SOURCE}:${SOURCE_ID}`).click();
    await page.getByRole("textbox", { name: "Your note" }).fill(NOTE);
    await page.getByRole("button", { name: "Save note" }).click();
    await expect(page.getByTestId("athlete-note-clear")).toBeVisible();
    await dialog.getByTestId("coaching-dialog-regenerate").click();

    // Assert
    await expect(page).toHaveURL(/\/workout\//, { timeout: 15_000 });
    await expect(page.getByText(AI_CUE)).toBeVisible();
    await expect(page.getByTitle("Written by the AI")).toBeVisible();
    expect(llm.bodies.at(-1)).toContain(NOTE);
    const stored = await storedStructured(page);
    expect(stored).toHaveLength(1);
    const krd = stored[0]?.krd as {
      extensions: { structured_workout: { steps: { notes?: string }[] } };
    };
    expect(krd.extensions.structured_workout.steps[0]?.notes).toBe(AI_CUE);
  });

  test("builds and regenerates from the table with no AI provider configured", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/calendar");
    await waitForDexieReady(page);
    await clearDexie(page);
    const llm = await routeLlm(page);
    const day = getWeekDates(0)[2];
    await seed(page, day, new Date(day + "T08:00:00Z").toISOString());
    await page.goto(`/calendar/${getWeekId(day)}`);
    await page.getByTestId(`coaching-card-${SOURCE}:${SOURCE_ID}`).click();
    const dialog = page.getByTestId("coaching-activity-dialog");

    // Act — the first build
    await dialog.getByTestId("coaching-dialog-ai-process").click();

    // Assert
    await expect(page).toHaveURL(/\/workout\//, { timeout: 15_000 });
    expect(await storedStructured(page)).toHaveLength(1);

    // Act — Regenerate
    await page.goto(`/calendar/${getWeekId(day)}`);
    await page.getByTestId(`matched-card-${SOURCE}:${SOURCE_ID}`).click();
    await dialog.getByTestId("coaching-dialog-regenerate").click();

    // Assert
    await expect(page).toHaveURL(/\/workout\//, { timeout: 15_000 });
    await expect(page.getByTestId("coaching-dialog-ai-processing")).toHaveCount(
      0
    );
    await expect(page.getByTestId("coaching-dialog-ai-error")).toHaveCount(0);
    const stored = await storedStructured(page);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.aiMeta).toBeNull();
    expect(llm.count).toBe(0);
  });
});
