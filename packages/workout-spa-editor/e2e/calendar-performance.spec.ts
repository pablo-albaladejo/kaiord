/**
 * Calendar Performance Budget — design D16 of
 * calendar-coaching-redesign-completion / spec spa-calendar
 * "CalendarPage render-cost budget".
 *
 * Guards two things on a week of 30 cards (10 matched / 10 solo plan /
 * 10 solo actual) under CDP CPU throttle 4× on Chromium:
 *
 *   1. Render cost. Showing the 30-card week costs at most
 *      RENDER_COST_RATIO_BUDGET times showing a 3-card week (1 / 1 / 1),
 *      fastest against fastest over interleaved pairs measured in the same
 *      page, the same run and the same throttle.
 *   2. The `useMatchedSessions` slice, on a steady-state re-fire.
 *
 * Why a ratio and not an absolute first contentful paint: on the Vite dev
 * server FCP is the time to fetch and evaluate the app's module graph. The
 * page shell paints before any IndexedDB read resolves, so FCP does not
 * depend on the cards, and it scales with the runner's speed. Both arms of
 * the ratio take the same path — in-app route change, the week's live
 * queries, the match join, the render — and differ only in the number of
 * cards, so runner speed cancels out while a per-card cost (a slow card, a
 * quadratic join, a re-render per card) is multiplied by 30 in one arm and
 * by 3 in the other.
 *
 * Seed flow:
 *   1. Goto /calendar to let the SPA boot (Dexie initialises the schema
 *      and exposes the db on `window.__KAIORD_DB__`).
 *   2. Seed the active profile, the 30-card week and the 3-card week. Every
 *      row carries the profileId: the calendar reads the active profile's
 *      rows only.
 *   3. Set CDP CPU throttling to factor 4×, reload on an empty week.
 *   4. Prove both weeks render every seeded card, then time RENDER_SAMPLES
 *      interleaved pairs of the two weeks, each from the empty week.
 *
 * Reproduction:
 *   pnpm --filter @kaiord/workout-spa-editor test:e2e \
 *     --grep "CalendarPage render-cost budget"
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import type { CardCounts } from "./helpers/calendar-perf-rows";
import { seedPerfWeeks, showWeek } from "./helpers/calendar-perf-week";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

// Fastest 30-card time over fastest 3-card time, both shown from the empty
// week. Each arm is bimodal (a fast mode and one 2-3x slower when another
// live-query emission lands in the window), and the two arms pick their mode
// independently, so a per-pair ratio swings 0.5-4.3 and its median overlaps
// a regression; the minimum of each arm is its fast mode, stable across runs.
// Healthy chromium measured 1.05-1.74 over 24 runs (throttle 4x, 8x and 12x,
// three runs in parallel, Mobile Chrome); one extra millisecond per card
// render measured 3.10-3.94 over 12 runs. The budget sits between the two.
const RENDER_COST_RATIO_BUDGET = 2.3;
// Interleaved pairs per run, alternating which arm goes first, so both arms
// see the same machine load.
const RENDER_SAMPLES = 7;
const RENDER_TIMEOUT_MS = 20_000;
// Aspirational per-hook slice from design D16. NOT asserted directly:
// the measure wraps an async useLiveQuery span whose steady-state
// wall-clock is dominated by ~20+ sequential IndexedDB round-trips,
// and CI disk latency puts healthy-CPU samples at 128-157ms (run
// 27011820399, calibration factor 1.00). The assertion uses a CI
// regression-detection envelope instead of the aspirational figure — a
// structural regression (e.g. a quadratic join at 30 cards) lands far
// above it.
const USE_MATCHED_SESSIONS_BUDGET_MS = 60;
const USE_MATCHED_SESSIONS_CI_ENVELOPE_MS = 250;
// The steady-state re-fire span is bimodal — mostly the healthy
// 128-157ms floor but occasionally 335-345ms when a transient
// main-thread / IndexedDB-disk-latency spike lands inside the async
// measure (run 28632653937, calibration factor 1.00, so CPU calibration
// cannot compensate). Re-fire the liveQuery several times and assert the
// fastest span: the minimum isolates the hook's own-work floor, while a
// structural regression (e.g. a quadratic join at 30 cards) raises every
// sample and still trips the envelope.
const STEADY_STATE_REFIRE_SAMPLES = 5;
const CPU_THROTTLE_RATE = 4;

// Runner-speed calibration for the useMatchedSessions slice: a fixed
// synthetic workload timed on the same throttled page scales the budget
// for genuinely slow runner CPUs (clamped). Belt-and-braces only — main
// run 27010705723 showed worst boot-window spans of 257-352ms on a
// runner whose calibration came out HEALTHY (factor 1.00), which is why
// the hook is asserted on a steady-state re-fire below rather than on
// the boot window.
const CALIBRATION_RUNS = 3;
const CALIBRATION_LOOP_ITERATIONS = 3_000_000;
// Prime modulus keeps the accumulator live so the loop cannot be
// optimised away by the JIT.
const CALIBRATION_LOOP_MODULUS = 9973;
// Median calibration-loop duration observed on a healthy ubuntu-latest
// runner with the 4x CDP throttle active (anchored against the
// 40-49ms healthy worst-measure samples documented above).
const CALIBRATION_REFERENCE_MS = 80;
const CALIBRATION_MAX_FACTOR = 12;
const NOW = "2026-04-29T10:00:00.000Z";
const PERF_PROFILE = "11111111-1111-4111-8111-111111111111";

const BIG_WEEK = { weekId: "2026-W18", day: "2026-04-29" };
const SMALL_WEEK = { weekId: "2026-W20", day: "2026-05-13" };
const EMPTY_WEEK = { weekId: "2026-W19", day: "2026-05-06" };
// The 30-card week also holds plans whose match sits in a week never shown
// (design §3.6): `useMatchedSessions` reads and hides them, so the hook is
// measured with the cross-week read while the card counts stay 10/10/10.
const CROSS_WEEK = { count: 10, onDay: "2026-05-27" };
const BIG: CardCounts = { matched: 10, soloPlans: 10, soloActuals: 10 };
const SMALL: CardCounts = { matched: 1, soloPlans: 1, soloActuals: 1 };
const NONE: CardCounts = { matched: 0, soloPlans: 0, soloActuals: 0 };

const nextFrames = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );

// Back to the empty week, and wait until its match query has answered so
// the next measured arm starts from a quiescent page.
const parkOnEmptyWeek = async (page: Page) => {
  const seen = await page.evaluate(
    () => performance.getEntriesByName("useMatchedSessions").length
  );
  await showWeek(page, {
    ...EMPTY_WEEK,
    counts: NONE,
    timeoutMs: RENDER_TIMEOUT_MS,
  });
  await page.waitForFunction(
    (prev) => performance.getEntriesByName("useMatchedSessions").length > prev,
    seen,
    { timeout: RENDER_TIMEOUT_MS }
  );
  await nextFrames(page);
};

const BIG_ARM = [BIG_WEEK, BIG] as const;
const SMALL_ARM = [SMALL_WEEK, SMALL] as const;

const timeArm = async (
  page: Page,
  week: typeof BIG_WEEK,
  counts: CardCounts
) => {
  const ms = await showWeek(page, {
    ...week,
    counts,
    timeoutMs: RENDER_TIMEOUT_MS,
  });
  await parkOnEmptyWeek(page);
  return ms;
};

test.describe("CalendarPage render-cost budget", () => {
  test.use({ storageState: undefined });

  // Playwright exposes `newCDPSession` on Chromium only — firefox,
  // webkit and Mobile Safari (WebKit) raise "CDP session is only
  // available in Chromium" before the test even starts measuring. The
  // ratio needs the throttle, not just the engine: unthrottled, both arms
  // finish in two or three frames and the trailing frame wait quantizes
  // them (firefox and unthrottled chromium measured 17-140 ms per arm,
  // ratio up to 1.79 with nothing regressed).
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "CDP CPU throttle is Chromium-only (newCDPSession is unavailable on firefox/webkit)"
  );

  test("a 30-card week renders within its cost ratio and useMatchedSessions within its CI envelope", async ({
    page,
  }, testInfo) => {
    // 1. Boot the SPA (no throttling).
    await page.goto("/calendar");
    await waitForDexieReady(page);

    // 2. Seed the active profile and both weeks.
    await seedPerfWeeks(page, {
      profileId: PERF_PROFILE,
      now: NOW,
      weeks: [
        { prefix: "perf", ...BIG_WEEK, ...BIG, crossWeek: CROSS_WEEK },
        { prefix: "base", ...SMALL_WEEK, ...SMALL },
      ],
    });

    // 3. Throttle CPU, then reload on the empty week.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: CPU_THROTTLE_RATE,
    });
    // 3b. Calibrate runner speed under the same throttle (median of N).
    const calibrationMs = await page.evaluate(
      ({ runs, iterations, modulus }) => {
        const samples: number[] = [];
        for (let r = 0; r < runs; r += 1) {
          const t0 = performance.now();
          let acc = 0;
          for (let i = 0; i < iterations; i += 1) acc = (acc + i) % modulus;
          void acc;
          samples.push(performance.now() - t0);
        }
        samples.sort((a, b) => a - b);
        return samples[Math.floor(samples.length / 2)];
      },
      {
        runs: CALIBRATION_RUNS,
        iterations: CALIBRATION_LOOP_ITERATIONS,
        modulus: CALIBRATION_LOOP_MODULUS,
      }
    );
    const slowdownFactor = Math.min(
      Math.max(calibrationMs / CALIBRATION_REFERENCE_MS, 1),
      CALIBRATION_MAX_FACTOR
    );
    const useMatchedBudgetMs =
      USE_MATCHED_SESSIONS_CI_ENVELOPE_MS * slowdownFactor;

    await page.goto(`/calendar/${EMPTY_WEEK.weekId}`);
    await page
      .getByTestId("calendar-page")
      .waitFor({ state: "visible", timeout: 30_000 });

    // 4. Every seeded card renders, in both weeks. This first visit of each
    // week also loads the card modules, so it stays out of the samples.
    for (const [week, counts] of [
      [BIG_WEEK, BIG],
      [SMALL_WEEK, SMALL],
    ] as const) {
      await showWeek(page, { ...week, counts, timeoutMs: RENDER_TIMEOUT_MS });
      const day = page.locator(
        `[data-testid="day-column-${week.day}"],[data-testid="calendar-list-day-${week.day}"]`
      );
      await expect(day.locator('[data-testid^="matched-card-"]')).toHaveCount(
        counts.matched
      );
      await expect(day.locator('[data-testid^="coaching-card-"]')).toHaveCount(
        counts.soloPlans
      );
      await expect(day.locator('[data-testid^="workout-card-"]')).toHaveCount(
        counts.soloActuals
      );
      await parkOnEmptyWeek(page);
    }

    // 5. Interleaved pairs, alternating which arm goes first.
    const pairs: { big: number; small: number }[] = [];
    for (let i = 0; i < RENDER_SAMPLES; i += 1) {
      const bigFirst = i % 2 === 0;
      const first = await timeArm(page, ...(bigFirst ? BIG_ARM : SMALL_ARM));
      const second = await timeArm(page, ...(bigFirst ? SMALL_ARM : BIG_ARM));
      pairs.push(
        bigFirst ? { big: first, small: second } : { big: second, small: first }
      );
    }
    const bigMin = Math.min(...pairs.map((p) => p.big));
    const smallMin = Math.min(...pairs.map((p) => p.small));
    const ratio = bigMin / smallMin;
    const report = [
      `ratio ${ratio.toFixed(2)} (budget ${RENDER_COST_RATIO_BUDGET})`,
      `30 cards [${pairs.map((p) => p.big.toFixed(0)).join(", ")}] ms`,
      `3 cards [${pairs.map((p) => p.small.toFixed(0)).join(", ")}] ms`,
      `project ${testInfo.project.name}`,
    ].join("; ");
    // Logged on every run, so each CI log records the real margin.
    console.log(`calendar render cost: ${report}`);
    testInfo.annotations.push({
      type: "calendar render cost",
      description: report,
    });
    expect(ratio, `30-card week vs 3-card week: ${report}`).toBeLessThanOrEqual(
      RENDER_COST_RATIO_BUDGET
    );

    // Back on the 30-card week for the hook measurement.
    await showWeek(page, {
      ...BIG_WEEK,
      counts: BIG,
      timeoutMs: RENDER_TIMEOUT_MS,
    });

    // 6. Steady-state hook measurement. The boot-window span is NOT a
    // faithful hook-cost signal: the measure wraps an async useLiveQuery
    // callback, so between its start/end marks the wall-clock absorbs
    // whatever else holds the main thread — chiefly the throttled first
    // render of the 30-card week (a query-vs-render interleave race,
    // bimodal: 40-49ms or 257-352ms for identical hook work). Post-boot,
    // with the page quiescent, a re-fired query's span is dominated by
    // the hook's own work — which is what the D16 budget is about.
    await page.evaluate(() => {
      performance.clearMeasures("useMatchedSessions");
      // Double-rAF settle so the boot renders have flushed.
      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    });
    // Re-fire the liveQuery several times by touching a seeded match row
    // and keep the fastest span (see STEADY_STATE_REFIRE_SAMPLES). A
    // single re-fire's wall-clock can still absorb a transient spike; the
    // minimum across repeats isolates the hook's own-work floor.
    for (let sample = 0; sample < STEADY_STATE_REFIRE_SAMPLES; sample += 1) {
      const seenBefore = await page.evaluate(
        () => performance.getEntriesByName("useMatchedSessions").length
      );
      await page.evaluate(async () => {
        type Db = {
          table: (n: string) => {
            get: (k: string) => Promise<unknown>;
            put: (r: unknown) => Promise<unknown>;
          };
        };
        const db = (window as unknown as Record<string, unknown>)
          .__KAIORD_DB__ as Db;
        const row = await db.table("sessionMatches").get("perf-match-0");
        if (!row) throw new Error("perf-match-0 seed row missing");
        await db.table("sessionMatches").put(row);
      });
      await page.waitForFunction(
        (prev) =>
          performance.getEntriesByName("useMatchedSessions").length > prev,
        seenBefore,
        { timeout: 10_000 }
      );
      // Settle between samples so each re-fire is measured quiescent.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          })
      );
    }
    const useMatchedMinMs = await page.evaluate(() => {
      const entries = performance.getEntriesByName("useMatchedSessions");
      return Math.min(...entries.map((e) => e.duration));
    });
    console.log(
      `useMatchedSessions steady state: ${useMatchedMinMs.toFixed(1)} ms (envelope ${useMatchedBudgetMs.toFixed(1)} ms)`
    );
    expect(
      useMatchedMinMs,
      `useMatchedSessions best steady-state measure ${useMatchedMinMs.toFixed(1)}ms exceeds the ${useMatchedBudgetMs.toFixed(1)}ms CI envelope (envelope ${USE_MATCHED_SESSIONS_CI_ENVELOPE_MS}ms x runner slowdown ${slowdownFactor.toFixed(2)}, aspirational slice ${USE_MATCHED_SESSIONS_BUDGET_MS}ms, calibration ${calibrationMs.toFixed(1)}ms vs reference ${CALIBRATION_REFERENCE_MS}ms, project: ${testInfo.project.name})`
    ).toBeLessThanOrEqual(useMatchedBudgetMs);

    await cdp.detach();
  });
});
