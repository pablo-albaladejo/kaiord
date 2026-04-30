/**
 * updateTemplate — application use case.
 *
 * Reads the target template, applies a partial update, writes back.
 * The read-modify-write runs inside `persistence.transaction` so a
 * concurrent writer cannot clobber the merge result. Throws
 * `TemplateNotFoundError` when the id is unknown so the calling
 * component can surface a "Template no longer exists" toast instead
 * of silently no-op'ing.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import type { WorkoutTemplate } from "../../types/workout-library";
import { TemplateNotFoundError } from "./errors";
import { updateTemplateData } from "./helpers/template-factory";

export type UpdateTemplateInput = Partial<
  Pick<
    WorkoutTemplate,
    "name" | "tags" | "difficulty" | "duration" | "notes" | "thumbnailData"
  >
>;

export const updateTemplate = async (
  persistence: PersistencePort,
  templateId: string,
  updates: UpdateTemplateInput
): Promise<WorkoutTemplate> =>
  persistence.transaction(async () => {
    const existing = await persistence.templates.getById(templateId);
    if (!existing) throw new TemplateNotFoundError(templateId);

    const updated = updateTemplateData(existing, updates);
    await persistence.templates.put(updated);
    return updated;
  });
