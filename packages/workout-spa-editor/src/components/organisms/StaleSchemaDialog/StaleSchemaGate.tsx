import { Suspense, useEffect } from "react";

import { useStaleSchema } from "../../../hooks/use-stale-schema";
import { lazyPage } from "../../../lazy-page";

const loadScreen = () =>
  import("./StaleSchemaMidSession").then((m) => ({
    default: m.StaleSchemaMidSession,
  }));

const LazyStaleSchemaMidSession = lazyPage(loadScreen);

/** Mid-session: another tab upgraded the database, so this one stops. */
export const StaleSchemaGate = () => {
  const stale = useStaleSchema();
  // Fetched now, outside the initial JS: once a newer deploy has replaced
  // this build's chunks, the screen could no longer be loaded.
  useEffect(() => {
    loadScreen().catch(() => undefined);
  }, []);
  if (!stale) return null;
  return (
    <Suspense fallback={null}>
      <LazyStaleSchemaMidSession />
    </Suspense>
  );
};
