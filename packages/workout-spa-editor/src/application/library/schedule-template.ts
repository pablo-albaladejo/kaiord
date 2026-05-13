/**
 * scheduleTemplate — application use case.
 *
 * Materialises a workout record from a library template on a given
 * calendar date. The caller already has the date in hand (e.g. from
 * the calendar empty-day picker); this use case does NOT prompt for
 * a date — that's the page-level scheduler's job. Throws on persistence
 * rejection so the calling component surfaces a user-visible error.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { WorkoutTemplate } from "../../types/workout-library";

export type ScheduleTemplateInput = {
  templateId: string;
  date: string;
  profileId: string;
};

export const scheduleTemplate = async (
  persistence: PersistencePort,
  { templateId, date, profileId }: ScheduleTemplateInput
): Promise<WorkoutRecord> => {
  const template = await persistence.templates.getById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  const record = createWorkoutFromTemplate(template, date, profileId);
  await persistence.workouts.put(record);
  return record;
};

function createWorkoutFromTemplate(
  template: WorkoutTemplate,
  date: string,
  profileId: string
): WorkoutRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    profileId,
    date,
    sport: template.sport,
    source: "kaiord",
    sourceId: null,
    planId: null,
    state: "structured",
    raw: null,
    krd: template.krd,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [...template.tags],
    previousState: null,
    createdAt: now,
    modifiedAt: null,
    updatedAt: now,
  };
}
