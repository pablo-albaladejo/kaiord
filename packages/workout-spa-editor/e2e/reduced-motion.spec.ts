import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";

/**
 * WCAG 2.3.3 (Animation from Interactions): the app must not animate the theme
 * change for users who ask their OS for reduced motion.
 *
 * Scrolling never glides by default, whatever the preference: a programmatic
 * scroll (a route or section reset, a focus move) jumps. A glide moves the page
 * under a press that has already started, and the release lands on another
 * element. A caller that wants a glide asks for it per call and checks the
 * preference itself.
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

const START_OFFSET = 1500;

// Where a default-behaviour scroll has got to when the call returns: a jump is
// already there, a glide has barely left the top.
const offsetRightAfterScroll = (page: Page) =>
  page.evaluate((offset) => {
    // Tall enough to scroll on every viewport, desktop included.
    document.body.style.minHeight = "5000px";
    window.scrollTo({ top: offset });
    return Math.round(window.scrollY);
  }, START_OFFSET);

// "none" and a zero duration are both how a browser reports "no transition".
const isNoTransition = (property: string, duration: string) =>
  property === "none" ||
  duration.split(",").every((d) => parseFloat(d.trim()) === 0);

const bodyTransitions = async (page: Page) => {
  const motion = await readMotion(page);
  return !isNoTransition(
    motion.bodyTransitionProperty,
    motion.bodyTransitionDuration
  );
};

// Before the app stylesheet applies every property reads as the UA default,
// which would pass a "no glide" check for nothing. The body background is the
// stylesheet's, so it only stops being transparent once the sheet is in.
const waitForStylesheet = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    )
    .not.toBe("rgba(0, 0, 0, 0)");

test.describe("prefers-reduced-motion: reduce", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("should jump on programmatic scrolls and drop theme transitions", async ({
    page,
  }) => {
    await page.goto("/workout/new?source=scratch");
    await waitForStylesheet(page);

    const motion = await readMotion(page);
    expect(motion.scrollBehavior).toBe("auto");
    expect(
      isNoTransition(
        motion.htmlTransitionProperty,
        motion.htmlTransitionDuration
      )
    ).toBe(true);
    expect(await bodyTransitions(page)).toBe(false);
    expect(await offsetRightAfterScroll(page)).toBe(START_OFFSET);
  });
});

test.describe("no motion preference", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("should jump on programmatic scrolls but keep theme transitions", async ({
    page,
  }) => {
    await page.goto("/workout/new?source=scratch");
    await waitForStylesheet(page);

    const motion = await readMotion(page);
    expect(
      isNoTransition(
        motion.htmlTransitionProperty,
        motion.htmlTransitionDuration
      )
    ).toBe(false);
    expect(await bodyTransitions(page)).toBe(true);
    expect(await offsetRightAfterScroll(page)).toBe(START_OFFSET);
    expect(motion.scrollBehavior).toBe("auto");
  });
});
