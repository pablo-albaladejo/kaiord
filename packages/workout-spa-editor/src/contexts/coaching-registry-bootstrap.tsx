/**
 * CoachingRegistryBootstrap — Composition root for coaching source factories.
 *
 * This is the ONLY file that imports platform-specific adapters.
 * Adding a new platform = one import + one entry in the factories array.
 *
 * Factories are React hooks invoked downstream by useCoachingActivities
 * with the current (activeProfileId, days). The factory pattern keeps
 * each platform's useLiveQuery / useStore calls at hook top-level.
 */

import type { ReactNode } from "react";

import { useTrain2GoSource } from "../adapters/train2go/use-train2go-source";
import type { CoachingSourceFactory } from "../types/coaching-source";
import { CoachingRegistryProvider } from "./coaching-registry-context";

export function CoachingRegistryBootstrap({
  children,
}: {
  children: ReactNode;
}) {
  const factories: CoachingSourceFactory[] = [
    useTrain2GoSource,
    // Future: useTrainingPeaksSource,
  ];

  return (
    <CoachingRegistryProvider factories={factories}>
      {children}
    </CoachingRegistryProvider>
  );
}
