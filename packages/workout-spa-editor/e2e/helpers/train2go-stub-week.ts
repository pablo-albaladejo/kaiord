/**
 * A coach move for the Train2Go bridge stub: what its `read-week` returns
 * from the next call on, replacing `weekActivities`. The scripted week lives
 * on `window.__T2G_STUB_WEEK__` and in tab storage, so it survives same-tab
 * navigations and reloads like the stub's call log (#990).
 */
import type { Page } from "@playwright/test";

const WEEK_KEY = "__T2G_STUB_WEEK_STORE__";

/**
 * Init script: bring a scripted week back after a page load. Serialised by
 * Playwright, so it spells the storage key out instead of using WEEK_KEY.
 */
export const restoreStubWeekScript = (): void => {
  try {
    const scripted = window.sessionStorage.getItem("__T2G_STUB_WEEK_STORE__");
    if (scripted !== null) {
      (window as unknown as Record<string, unknown>).__T2G_STUB_WEEK__ =
        JSON.parse(scripted);
    }
  } catch {
    // opaque-origin storage unavailable — `read-week` keeps `weekActivities`.
  }
};

/** A coach move is the same activity `id` on a new `date`. */
export const setStubWeekActivities = (
  page: Page,
  activities: readonly unknown[]
): Promise<void> =>
  page.evaluate(
    ({ key, week }) => {
      (window as unknown as Record<string, unknown>).__T2G_STUB_WEEK__ = week;
      try {
        window.sessionStorage.setItem(key, JSON.stringify(week));
      } catch {
        // sessionStorage unavailable — this page load still sees the week.
      }
    },
    { key: WEEK_KEY, week: activities }
  );
