import { useEffect } from "react";

// Explicit files, not the directory barrel: the converter's esbuild resolves
// this path literally and fails with "is a directory".
import { useGarminBridge } from "../../packages/workout-spa-editor/src/contexts/garmin-bridge-context";
import type { PushState } from "../../packages/workout-spa-editor/src/contexts/garmin-bridge-types";
import { GarminPushButton } from "../../packages/workout-spa-editor/src/components/molecules/GarminPushButton/GarminPushButton";
import type { GarminPlacementNotice } from "../../packages/workout-spa-editor/src/hooks/use-garmin-placement-notice";

/**
 * `GarminPushButton.stories.tsx` reaches every non-idle state by forcing the
 * shared `GarminBridge` context into a push state via a `useEffect`, not via
 * a decorator — the card harness mounts this component the same way, so the
 * trick still works without any wrapper. `GarminBridgeProvider` itself is
 * already supplied by `DesignSystemProviders`.
 */
/** No placement to report: the record has no ledger row yet (as the story). */
const NO_NOTICE: GarminPlacementNotice = {
  removable: [],
  setLastRun: () => undefined,
};

function WithPushState({ state }: { state: PushState }) {
  const { setPushing } = useGarminBridge();
  useEffect(() => {
    setPushing(state);
  }, [state, setPushing]);
  return <GarminPushButton notice={NO_NOTICE} />;
}

const LOADING_STATE: PushState = { status: "loading" };
const SUCCESS_STATE: PushState = { status: "success" };
const ERROR_STATE: PushState = {
  status: "error",
  message: "Push failed: 403",
};

export const Idle = () => <GarminPushButton notice={NO_NOTICE} />;
export const Sending = () => <WithPushState state={LOADING_STATE} />;
export const Sent = () => <WithPushState state={SUCCESS_STATE} />;
export const Failed = () => <WithPushState state={ERROR_STATE} />;
