import { cutRequest } from "../agents/cut-request";
import type { AiRequest } from "../observability/telemetry-types";
import type { TurnCut } from "./turn-stats";

/**
 * The step a turn was running when it ended. A Stop or the watchdog cut a
 * request the Provider was answering, so it is billed and estimated: a Stop
 * stays `stopped`, a timeout is a failure. A thrown failure is estimated
 * only once the step had streamed output; before any, the Provider answered
 * with an error it does not bill, and the request stays unmeasured.
 */
export const inFlightRequest = (
  cut: TurnCut,
  sentChars: number,
  streamed: number
): AiRequest => {
  if (cut === "stopped") return cutRequest("stopped", sentChars, streamed);
  if (cut === "timeout" || streamed > 0)
    return cutRequest("error", sentChars, streamed);
  return { outcome: "error" };
};
