/**
 * useBridgeThemePush — tells every discovered bridge which theme the user
 * picked, so its popup matches the app instead of staying dark.
 *
 * Sends the PREFERENCE (`light` | `dark` | `system`), not the resolved
 * value: a `system` popup follows the OS scheme itself. The bridge pins
 * the sender origin and the three literals (bridge-core `set-theme`).
 *
 * Fires when a bridge is discovered and whenever the preference changes,
 * on the shared per-bridge queue so it shares the protocol's 60/h budget.
 * Dedup keys on the last value QUEUED, not the last acknowledged: the queue
 * runs a bridge's sends in order, so the latest queued value is the one the
 * bridge ends on, and A→B→A while B is in flight still sends the final A.
 * A failed send forgets its value so the next change or discovery retries
 * it. A non-retryable refusal — a bridge released before `set-theme` —
 * parks that extension for the session instead of spending its budget.
 */

import { useEffect, useRef } from "react";

import { sendBridgeMessage } from "../adapters/bridge/bridge-transport";
import { BRIDGE_QUEUE } from "../adapters/bridge/shared-operation-queue";
import { type Theme, useTheme } from "../contexts/ThemeContext";
import { useDiscoveredBridges } from "./use-discovered-bridges";

export const useBridgeThemePush = (): void => {
  const { theme } = useTheme();
  const bridges = useDiscoveredBridges();
  const queuedRef = useRef<Map<string, Theme>>(new Map());
  const refusedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const queued = queuedRef.current;
    const refused = refusedRef.current;
    for (const { bridgeId, extensionId } of bridges) {
      if (refused.has(extensionId) || queued.get(extensionId) === theme)
        continue;
      queued.set(extensionId, theme);
      const forget = () => {
        if (queued.get(extensionId) === theme) queued.delete(extensionId);
      };
      void BRIDGE_QUEUE.enqueue({
        bridgeId,
        execute: () =>
          sendBridgeMessage(extensionId, { action: "set-theme", theme }),
      })
        .then((res) => {
          if (res?.ok) return;
          if (res?.retryable === false) refused.add(extensionId);
          forget();
        })
        .catch(forget);
    }
  }, [bridges, theme]);
};
