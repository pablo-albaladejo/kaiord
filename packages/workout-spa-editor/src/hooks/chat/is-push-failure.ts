/** True when a push_to_garmin result carries an app error code. */
export const isPushFailure = (output: unknown): boolean =>
  typeof output === "object" && output !== null && "error" in output;
