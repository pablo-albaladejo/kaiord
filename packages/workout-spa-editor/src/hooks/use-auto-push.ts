/**
 * useAutoPush — request a debounced cloud push whenever persisted data
 * changes.
 *
 * `changeToken` is any value that advances when the synced tables mutate
 * (e.g. a Dexie `useLiveQuery` row count). On every transition after the
 * first render this calls `requestPush`, which itself debounces, so a
 * burst of edits collapses into a single Drive write. The initial render
 * is skipped so opening the app does not trigger a spurious push.
 */

import { useEffect, useRef } from "react";

export function useAutoPush(
  changeToken: unknown,
  requestPush: () => void
): void {
  const previous = useRef<unknown>(changeToken);

  useEffect(() => {
    if (Object.is(previous.current, changeToken)) return;
    previous.current = changeToken;
    requestPush();
  }, [changeToken, requestPush]);
}
