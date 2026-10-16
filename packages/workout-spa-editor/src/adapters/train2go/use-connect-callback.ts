/** `useConnectCallback` — split out so `use-train2go-actions.ts` stays under cap. */
import type { Analytics } from "@kaiord/core";
import { useCallback, useRef } from "react";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { lazyImport } from "../../lib/lazy-import";
import type { PersistencePort } from "../../ports/persistence-port";
import { seedBridgeRoutes } from "../bridge/seed-bridge-routes";
import { emitLinkResult } from "./coaching-telemetry";
import { shouldFanOutZones } from "./should-fan-out-zones";

const TRAIN2GO_BRIDGE = "train2go-bridge";

export const useConnectCallback = (
  p: PersistencePort,
  t: CoachingTransport,
  a: Analytics,
  runZonesSync?: (profileId: string) => Promise<void>
) => {
  const abortRef = useRef<AbortController | null>(null);
  return useCallback(
    async (profileId: string) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const { attemptLink } = await lazyImport(
        () => import("../../application/coaching/attempt-link")
      );
      const r = await attemptLink(
        { profiles: p.profiles, transport: t },
        profileId,
        ctrl.signal
      );
      emitLinkResult(a, t.source, r);
      if (!r.ok) return;
      await seedBridgeRoutes(p, profileId, TRAIN2GO_BRIDGE);
      if (runZonesSync && (await shouldFanOutZones(p, t.source, profileId))) {
        await runZonesSync(profileId).catch(() => undefined);
      }
    },
    [p, t, a, runZonesSync]
  );
};
