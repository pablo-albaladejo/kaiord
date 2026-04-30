/**
 * useAiCustomPromptLive — reactive read hook for the user-supplied
 * custom system prompt appended to every AI generation.
 *
 * Three resolved states callers SHALL distinguish:
 *   - `undefined` — loading (first paint, before Dexie resolves)
 *   - `null`       — no row in the meta table yet (never set)
 *   - `string`     — the persisted prompt (may be `""` after the user clears it)
 */

import { useLiveQuery } from "dexie-react-hooks";

import { aiProviderRepository } from "../adapters/dexie";

export const useAiCustomPromptLive = (): string | null | undefined =>
  useLiveQuery<string | null>(() => aiProviderRepository.getCustomPrompt(), []);
