import { useEffect } from "react";

import {
  type PushState,
  useGarminBridge,
} from "@ds-stories/packages/workout-spa-editor/src/contexts";
import { GarminPushButton } from "@ds-stories/packages/workout-spa-editor/src/components/molecules/GarminPushButton/GarminPushButton";

/**
 * `GarminPushButton.stories.tsx` reaches every non-idle state by forcing the
 * shared `GarminBridge` context into a push state via a `useEffect`, not via
 * a decorator — the card harness mounts this component the same way, so the
 * trick still works without any wrapper. `GarminBridgeProvider` itself is
 * already supplied by `DesignSystemProviders`.
 */
function WithPushState({ state }: { state: PushState }) {
  const { setPushing } = useGarminBridge();
  useEffect(() => {
    setPushing(state);
  }, [state, setPushing]);
  return <GarminPushButton />;
}

const LOADING_STATE: PushState = { status: "loading" };
const SUCCESS_STATE: PushState = { status: "success" };
const ERROR_STATE: PushState = {
  status: "error",
  message: "Push failed: 403",
};

export const Idle = () => <GarminPushButton />;
export const Sending = () => <WithPushState state={LOADING_STATE} />;
export const Sent = () => <WithPushState state={SUCCESS_STATE} />;
export const Failed = () => <WithPushState state={ERROR_STATE} />;
