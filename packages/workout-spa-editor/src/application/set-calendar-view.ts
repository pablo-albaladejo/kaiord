/**
 * setCalendarView — sets the calendar view on the per-profile
 * UserPreferences row, keeping every other field of the row (including
 * those this build does not know) through `setUserPreferenceFields`, which
 * also sequences the profile-existence read before the write so a
 * concurrent profile delete surfaces as `ProfileNotFoundError`.
 */

import type { CalendarView } from "../types/user-preferences";
import {
  setUserPreferenceFields,
  type SetUserPreferenceFieldsDeps,
} from "./set-user-preference-fields";

export type SetCalendarViewInput = {
  profileId: string;
  view: CalendarView;
};

export type SetCalendarViewDeps = SetUserPreferenceFieldsDeps;

export async function setCalendarView(
  input: SetCalendarViewInput,
  deps: SetCalendarViewDeps
): Promise<void> {
  await setUserPreferenceFields(
    { profileId: input.profileId, patch: { calendarView: input.view } },
    deps
  );
}
