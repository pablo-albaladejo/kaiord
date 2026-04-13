/**
 * CoachingRegistryBootstrap — Composition root for coaching sources.
 *
 * This is the ONLY file that imports platform-specific adapters.
 * Adding a new platform = one import + one useMemo entry here.
 */

import type { ReactNode } from "react";

import { useTrain2GoSource } from "../adapters/train2go/use-train2go-source";
import { CoachingRegistryProvider } from "./coaching-registry-context";

export function CoachingRegistryBootstrap({
  children,
}: {
  children: ReactNode;
}) {
  const train2go = useTrain2GoSource();
  // Future: const trainingPeaks = useTrainingPeaksSource();

  const sources = [train2go];

  return (
    <CoachingRegistryProvider sources={sources}>
      {children}
    </CoachingRegistryProvider>
  );
}
