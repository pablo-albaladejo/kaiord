/**
 * Entering a Settings section resets the scroll to the top. The app sets
 * `html { scroll-behavior: smooth }`, which turned that reset into a ~200 ms
 * glide: the section moved under the pointer right after it opened, and a
 * press that started on "Add account" was released over another element, so
 * the click went to their common ancestor and the form never opened. That is
 * how `ai-generate-workout` 8.10 failed on Mobile Safari.
 *
 * Every animation frame's scroll offset is recorded: a jump goes straight to
 * 0, a glide passes through the offsets in between.
 */

import { expect, test } from "./fixtures/base";
import { routeInApp } from "./helpers/route-in-app";

type Sampled = { __scrollSamples?: number[] };

const START_OFFSET = 1500;

test("should enter a settings section at the top without gliding there", async ({
  page,
}) => {
  // Arrange
  await page.addInitScript(() => {
    const record = () => {
      const samples = (window as Sampled).__scrollSamples;
      samples?.push(Math.round(document.scrollingElement?.scrollTop ?? 0));
      requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
  });
  await page.goto("/settings");
  await expect(page.getByTestId("settings-row-ai")).toBeVisible();
  const from = await page.evaluate((offset) => {
    // Tall enough to scroll on every viewport, desktop included.
    document.body.style.minHeight = "5000px";
    window.scrollTo({ top: offset, behavior: "instant" });
    (window as Sampled).__scrollSamples = [];
    return Math.round(document.scrollingElement?.scrollTop ?? 0);
  }, START_OFFSET);

  // Act
  await routeInApp(
    page,
    "/settings/ai",
    page.getByRole("button", { name: "Add account" })
  );
  await expect
    .poll(() => page.evaluate(() => document.scrollingElement?.scrollTop))
    .toBe(0);
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => done(null)))
  );

  // Assert
  const samples = await page.evaluate(
    () => (window as Sampled).__scrollSamples ?? []
  );
  expect(from).toBe(START_OFFSET);
  expect(samples.filter((y) => y > 0 && y < from)).toEqual([]);
});
