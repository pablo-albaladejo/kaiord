/**
 * useAutoPush — request a debounced cloud push whenever persisted data
 * changes.
 *
 * `changeToken` is any value that advances when the synced tables mutate
 * (e.g. a Dexie `useLiveQuery` token). It calls `requestPush` (which itself
 * debounces) on every transition EXCEPT the first one: a `useLiveQuery`
 * token resolves asynchronously from its loading/default value to the real
 * value on the second render, and that initial resolution must establish
 * the baseline without triggering a spurious push on app open.
 */

import { useEffect, useRef } from "react";

export function useAutoPush(
  changeToken: unknown,
  requestPush: () => void
): void {
  const previous = useRef<unknown>(changeToken);
  const settled = useRef<boolean>(false);

  useEffect(() => {
    if (Object.is(previous.current, changeToken)) return;
    previous.current = changeToken;
    if (!settled.current) {
      // First real transition (async token resolving from its sentinel) —
      // adopt it as the baseline, don't push.
      settled.current = true;
      return;
    }
    requestPush();
  }, [changeToken, requestPush]);
}
