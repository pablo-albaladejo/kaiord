/**
 * setCustomPrompt — persists the user-supplied additional system
 * prompt appended to every AI generation. Single-write; no
 * transaction needed.
 */

import type { PersistencePort } from "../../ports/persistence-port";

export const setCustomPrompt = async (
  persistence: PersistencePort,
  prompt: string
): Promise<void> => {
  await persistence.aiProviders.setCustomPrompt(prompt);
};
