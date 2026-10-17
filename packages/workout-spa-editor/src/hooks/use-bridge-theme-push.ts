/**
 * useBridgeThemePush — tells every discovered bridge which theme the user
 * picked, so its popup matches the app instead of staying dark.
 *
 * Sends the PREFERENCE (`light` | `dark` | `system`), not the resolved
 * value: a `system` popup follows the OS scheme itself. The bridge pins
 * the sender origin and the three literals (bridge-core `set-theme`).
 *
 * Fires when a bridge is discovered and whenever the preference changes.
 * Deduped per extension so a re-render never re-sends, and enqueued on the
 * shared per-bridge queue so it shares the protocol's 60/h budget. A bridge
 * released before `set-theme` refuses it; the refusal is left unrecorded
 * and retried on the next change or discovery.
 */

import { useEffect, useRef } from "react";

import { sendBridgeMessage } from "../adapters/bridge/bridge-transport";
import { BRIDGE_QUEUE } from "../adapters/bridge/shared-operation-queue";
import { useTheme } from "../contexts/ThemeContext";
import { useDiscoveredBridges } from "./use-discovered-bridges";

export const useBridgeThemePush = (): void => {
  const { theme } = useTheme();
  const bridges = useDiscoveredBridges();
  const sentRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const sent = sentRef.current;
    for (const bridge of bridges) {
      if (sent.get(bridge.extensionId) === theme) continue;
      void BRIDGE_QUEUE.enqueue({
        bridgeId: bridge.bridgeId,
        execute: () =>
          sendBridgeMessage(bridge.extensionId, { action: "set-theme", theme }),
      })
        .then((res) => {
          if (res?.ok) sent.set(bridge.extensionId, theme);
        })
        .catch(() => undefined);
    }
  }, [bridges, theme]);
};
