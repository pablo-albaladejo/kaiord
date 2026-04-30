/**
 * addTemplate — application use case.
 *
 * Persists a new template via `PersistencePort`. Single-write put;
 * no transaction needed (no multi-write invariants). Throws on
 * persistence rejection so the calling component surfaces a
 * user-visible error.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import type { KRD } from "../../types/krd";
import type { WorkoutTemplate } from "../../types/workout-library";
import {
  createNewTemplate,
  type CreateTemplateOptions,
} from "./helpers/template-factory";

export const addTemplate = async (
  persistence: PersistencePort,
  name: string,
  sport: string,
  krd: KRD,
  options: CreateTemplateOptions = {}
): Promise<WorkoutTemplate> => {
  const template = createNewTemplate(name, sport, krd, options);
  await persistence.templates.put(template);
  return template;
};
