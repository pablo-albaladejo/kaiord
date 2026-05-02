/**
 * useUnmatchSession — UI-side wrapper around the `unmatchSession` use
 * case. Same persistence-routed + transaction-wrapped pattern as
 * `useMatchSession`. Idempotent on missing rows (no-op).
 */

import { useCallback } from "react";

import { unmatchSession } from "../application/unmatch-session";
import { usePersistence } from "../contexts/persistence-context";

export function useUnmatchSession() {
  const persistence = usePersistence();
  return useCallback(
    async (input: { profileId: string; matchId: string }): Promise<void> => {
      await persistence.transaction(async () => {
        await unmatchSession(input, { repository: persistence.sessionMatch });
      });
    },
    [persistence]
  );
}
