/**
 * The verified state of one Connection, and nothing else.
 *
 * Every surface that words a Connection — its card, the page banner, the
 * header pill, a send button, the editor ribbon — reads this state and hands
 * it to `connectionNotice` from `@kaiord/i18n`, which is the same function
 * every extension popup calls. So two surfaces can never word one Connection
 * two ways, and none can state a cause the check did not establish.
 */
import type { ConnectionState } from "@kaiord/i18n";

import type { BridgeSessionSignal } from "./connection-source-status";
import type { SessionOutcome } from "./session-outcome";

export type { ConnectionState };

const STATE_OF: Record<SessionOutcome, ConnectionState> = {
  "signed-in": "working",
  "signed-out": "signed-out",
  "not-answering": "not-answering",
  "not-checked": "not-checked",
};

export const stateOfOutcome = (outcome: SessionOutcome): ConnectionState =>
  STATE_OF[outcome];

/**
 * Today's probe row, read once. A row the probe left inactive without the
 * Platform's refusal (`needsReauth`) could not tell why, whatever its error.
 */
export const sessionOutcomeOf = (
  signal: Pick<BridgeSessionSignal, "sessionActive" | "needsReauth">
): SessionOutcome => {
  if (signal.sessionActive) return "signed-in";
  return signal.needsReauth ? "signed-out" : "not-answering";
};

export type ConnectionPresence = {
  /** The extension announced itself and is still answering. */
  readonly installed: boolean;
  /** Discovery had its window, so an absent extension may be called absent. */
  readonly settled: boolean;
  /** A Session check exists for this extension at all. */
  readonly hasProbe: boolean;
};

/**
 * A row that is not installed but carries an error was installed, and its last
 * check got no answer: that is "not-answering", never "not-installed". An
 * extension with no Session check can only be trusted to be present, so it
 * shows no notice rather than an unverified one.
 */
export const connectionStateOf = (
  signal: BridgeSessionSignal | undefined,
  { installed, settled, hasProbe }: ConnectionPresence
): ConnectionState => {
  if (!installed) {
    if (signal?.error) return "not-answering";
    return settled ? "not-installed" : "checking";
  }
  if (!hasProbe) return "working";
  if (signal === undefined || signal.checking) return "checking";
  if (signal.lastCheckedAt === null) return "checking";
  if (signal.outdated) return "outdated";
  if (signal.notChecked === true) return "not-checked";
  return stateOfOutcome(sessionOutcomeOf(signal));
};

/** Whether a read or send may start: a working Connection, or one whose
    check asked nothing and leaves the answer to the use itself. */
export const connectionMayBeUsed = (
  state: ConnectionState
): state is "working" | "not-checked" =>
  state === "working" || state === "not-checked";
