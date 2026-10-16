import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";

/**
 * WCAG 2.3.3 (Animation from Interactions): the app must not smooth-scroll or
 * animate the theme change for users who ask their OS for reduced motion.
 *
 * Only this file emulates the preference, per describe block, through
 * `contextOptions`: the top-level `reducedMotion` option is not honoured by the
 * Playwright test runner and silently leaves the preference unset. The rest of the
 * suite keeps running without it, so it keeps testing what most users see.
 */

const readMotion = (page: Page) =>
  page.evaluate(() => {
    const html = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    return {
      scrollBehavior: html.scrollBehavior,
      htmlTransitionDuration: html.transitionDuration,
      htmlTransitionProperty: html.transitionProperty,
      bodyTransitionDuration: body.transitionDuration,
      bodyTransitionProperty: body.transitionProperty,
    };
  });

// "none" and a zero duration are both how a browser reports "no transition".
const isNoTransition = (property: string, duration: string) =>
  property === "none" ||
  duration.split(",").every((d) => parseFloat(d.trim()) === 0);

test.describe("prefers-reduced-motion: reduce", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("disables smooth scrolling and theme transitions", async ({ page }) => {
    await page.goto("/workout/new?source=scratch");
    await page.waitForLoadState("domcontentloaded");
    await expect
      .poll(async () => (await readMotion(page)).scrollBehavior)
      .toBe("auto");

    const motion = await readMotion(page);
    expect(
      isNoTransition(
        motion.htmlTransitionProperty,
        motion.htmlTransitionDuration
      )
    ).toBe(true);
    expect(
      isNoTransition(
        motion.bodyTransitionProperty,
        motion.bodyTransitionDuration
      )
    ).toBe(true);
  });
});

test.describe("no motion preference", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("keeps smooth scrolling and theme transitions", async ({ page }) => {
    await page.goto("/workout/new?source=scratch");
    await page.waitForLoadState("domcontentloaded");
    await expect
      .poll(async () => (await readMotion(page)).scrollBehavior)
      .toBe("smooth");

    const motion = await readMotion(page);
    expect(
      isNoTransition(
        motion.htmlTransitionProperty,
        motion.htmlTransitionDuration
      )
    ).toBe(false);
    expect(
      isNoTransition(
        motion.bodyTransitionProperty,
        motion.bodyTransitionDuration
      )
    ).toBe(false);
  });
});
