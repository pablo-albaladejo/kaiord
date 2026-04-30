/**
 * deleteTemplate — application use case.
 *
 * Removes a template by id. Single-write delete; no transaction
 * needed (templates have no multi-write invariants like profiles).
 * Throws on persistence rejection so the calling component surfaces
 * a user-visible error.
 */

import type { PersistencePort } from "../../ports/persistence-port";

export const deleteTemplate = async (
  persistence: PersistencePort,
  templateId: string
): Promise<void> => {
  await persistence.templates.delete(templateId);
};
