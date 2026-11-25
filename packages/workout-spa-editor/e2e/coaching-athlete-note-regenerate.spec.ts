/**
 * Athlete note, Regenerate, Delete and Split for an AI-built Workout: a
 * Train2Go plan synced through the bridge stub is built with the mocked AI,
 * the athlete adds "Your note", regenerates (the note reaches the model with
 * the coach's text, the Workout is replaced in place), deletes the Workout
 * from the dialog and undoes it, then splits the Coaching Activity from its
 * Workout, which stays split when the dialog opens again.
 */
import type { Page, Route } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { LLM_CYCLING_RESPONSE } from "./fixtures/llm-responses";
import { fulfillLlm } from "./fixtures/llm-sse";
import {
  DAY,
  type Db,
  matchedCard,
  NOW,
  PLAN_CARD,
  planOn,
  seedCoachProfile,
  WEEK_1,
} from "./helpers/coach-session-flow";
import { syncWeek } from "./helpers/coach-session-steps";
import { seedAiProvider } from "./helpers/seed-ai-provider";
import { clearDexie } from "./helpers/seed-dexie";
import { installTrain2GoBridgeStub } from "./helpers/train2go-bridge-stub";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const PROFILE_ID = "athlete-note-profile";
const NOTE = "on the trainer, skip the single-leg part";
const COACH_TEXT = planOn(DAY.TUE).description;

const captureLlm = async (page: Page): Promise<string[]> => {
  const bodies: string[] = [];
  const handler = async (route: Route) => {
    bodies.push(route.request().postData() ?? "");
    await fulfillLlm(route, LLM_CYCLING_RESPONSE);
  };
  await page.route("**/api.anthropic.com/**", handler);
  await page.route("**/api.openai.com/**", handler);
  await page.route("**/generativelanguage.googleapis.com/**", handler);
  return bodies;
};

/** The profile's workouts and matches, as ids. */
const readStore = (page: Page) =>
  page.evaluate(async () => {
    const db = (window as unknown as { __KAIORD_DB__: Db }).__KAIORD_DB__;
    const workouts = (await db.table("workouts").toArray()) as {
      id?: string;
      sourceId?: string | null;
    }[];
    const coachBuilt = workouts.filter((w) => w.id !== undefined);
    const matches = await db.table("sessionMatches").toArray();
    return {
      workoutIds: coachBuilt.map((w) => w.id),
      sourceIds: coachBuilt.map((w) => w.sourceId ?? null),
      matchedWorkoutIds: matches.map((m) => m.workoutId),
    };
  });

const openDialog = async (page: Page, matched: boolean) => {
  await page.goto(`/calendar/${WEEK_1}`);
  const card = matched
    ? matchedCard(page)
    : page.getByTestId(`coaching-card-${PLAN_CARD}`);
  await card.waitFor({ timeout: 15_000 });
  await card.click();
  await expect(page.getByTestId("coaching-activity-dialog")).toBeVisible();
};

const toWorkoutPage = (page: Page) =>
  expect(page).toHaveURL(/\/workout\/[0-9a-f-]{16,}/, { timeout: 15_000 });

test.describe("Athlete note, regenerate, delete and split", () => {
  test("should steer, rebuild, delete, restore and split an AI-built workout", async ({
    page,
  }) => {
    // Arrange — a synced Train2Go plan and an AI provider answering the mock
    await page.clock.setFixedTime(new Date(NOW));
    await installTrain2GoBridgeStub(page, {
      weekActivities: [planOn(DAY.TUE)],
    });
    await page.goto("/calendar");
    await waitForDexieReady(page);
    await clearDexie(page);
    await seedCoachProfile(page, PROFILE_ID);
    await seedAiProvider(page);
    const bodies = await captureLlm(page);
    await syncWeek(page, WEEK_1);
    await openDialog(page, false);

    // Act — generate
    await page.getByTestId("coaching-dialog-ai-process").click();
    await toWorkoutPage(page);
    const built = await readStore(page);

    // Assert — one workout, matched
    expect(built.matchedWorkoutIds).toEqual(built.workoutIds);
    expect(built.workoutIds).toHaveLength(1);
    const callsAfterBuild = bodies.length;

    // Act — add a note, then regenerate
    await openDialog(page, true);
    await page.getByRole("textbox", { name: "Your note" }).fill(NOTE);
    await page.getByRole("button", { name: "Save note" }).click();
    await expect(page.getByTestId("athlete-note-clear")).toBeVisible();
    await page.getByTestId("coaching-dialog-regenerate").click();
    await toWorkoutPage(page);

    // Assert — the model got the coach's text and the note; same workout
    const sent = bodies.slice(callsAfterBuild).join("\n");
    expect(sent).toContain(NOTE);
    expect(sent).toContain(COACH_TEXT);
    expect(await readStore(page)).toEqual(built);

    // Act — delete from the dialog
    await openDialog(page, true);
    await page.getByTestId("coaching-dialog-delete-workout").click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();

    // Assert — the workout and its match are gone: "To prepare"
    await expect(page.getByTestId("coaching-dialog-ai-process")).toBeVisible();
    await expect
      .poll(() => readStore(page))
      .toEqual({ workoutIds: [], sourceIds: [], matchedWorkoutIds: [] });

    // Act — undo
    await page.getByTestId("undo-delete-workout").click();

    // Assert — both are back
    await expect(page.getByTestId("linked-workout-section")).toBeVisible();
    await expect.poll(() => readStore(page)).toEqual(built);

    // Act — split from the linked-workout section's button
    await page
      .getByTestId("linked-workout-section")
      .getByRole("button", { name: "Split" })
      .click();

    // Assert — split, and it stays split when the dialog opens again
    await expect(page.getByTestId("coaching-dialog-ai-process")).toBeVisible();
    await page.keyboard.press("Escape");
    await openDialog(page, false);
    await expect(page.getByTestId("coaching-dialog-ai-process")).toBeVisible();
    await expect(page.getByTestId("linked-workout-section")).toHaveCount(0);
    const split = await readStore(page);
    expect(split.matchedWorkoutIds).toEqual([]);
    expect(split.workoutIds).toEqual(built.workoutIds);
    expect(split.sourceIds).toEqual([null]);
  });
});
