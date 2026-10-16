/**
 * The calendar day surface the device actually renders.
 *
 * A clean browser has no stored `calendarView`, so the calendar picks its
 * default from the viewport (`use-calendar-page.ts`): the week grid from
 * 768px up, the week list below it (every phone project). The two views
 * carry different test ids for the same day, so a spec that hardcodes the
 * grid's `day-column-*` / `empty-day-*` finds nothing on a phone.
 *
 * Resolve the surface from the page's viewport, with the app's own rule,
 * instead of forcing a view: the spec then exercises what the athlete sees.
 * Waiting on the list's ids also waits past the first paint, so a click does
 * not race the swap from the initial render to the viewport's view.
 */

import type { Locator, Page } from "@playwright/test";

/** Mirrors `defaultView()` in `src/components/pages/use-calendar-page.ts`. */
const GRID_MIN_WIDTH = 768;

export type CalendarDay = {
  /** The day's container: grid column or list section. */
  day: Locator;
  /** The control that opens "add to this day" for an empty day. */
  add: Locator;
};

export function calendarDay(page: Page, date: string): CalendarDay {
  const isGrid = (page.viewportSize()?.width ?? 0) >= GRID_MIN_WIDTH;
  return isGrid
    ? {
        day: page.getByTestId(`day-column-${date}`),
        add: page.getByTestId(`empty-day-${date}`),
      }
    : {
        day: page.getByTestId(`calendar-list-day-${date}`),
        add: page.getByTestId(`calendar-list-add-${date}`),
      };
}

/** The workout cards the calendar renders on `date`, in either view. */
export const workoutCardsOn = (page: Page, date: string): Locator =>
  calendarDay(page, date).day.locator('[data-testid^="workout-card-"]');
