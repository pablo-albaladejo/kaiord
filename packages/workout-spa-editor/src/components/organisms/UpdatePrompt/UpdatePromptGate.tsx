import { Suspense, useEffect, useSyncExternalStore } from "react";

import { lazyPage } from "../../../lazy-page";
import {
  getUpdateState,
  subscribeUpdateState,
} from "../../../lib/service-worker/update-store";
import { SilentErrorBoundary } from "../../molecules/SilentErrorBoundary";

const loadPrompt = () =>
  import("./UpdatePrompt").then((m) => ({ default: m.UpdatePrompt }));

const LazyUpdatePrompt = lazyPage(loadPrompt);

/**
 * Mounts the update prompt only once a new version is waiting, so the
 * prompt and the update flow it drives stay out of the initial JS.
 */
export const UpdatePromptGate = () => {
  const state = useSyncExternalStore(subscribeUpdateState, getUpdateState);
  // Fetched now, after first render: once a newer deploy has replaced this
  // build's chunks, the prompt could no longer be loaded.
  useEffect(() => {
    loadPrompt().catch(() => undefined);
  }, []);
  if (state === "idle") return null;
  return (
    <SilentErrorBoundary name="update-prompt">
      <Suspense fallback={null}>
        <LazyUpdatePrompt />
      </Suspense>
    </SilentErrorBoundary>
  );
};
