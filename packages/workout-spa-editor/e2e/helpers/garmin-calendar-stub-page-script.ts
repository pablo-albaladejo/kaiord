/**
 * Page-side state for the Garmin bridge stub: failure injection, delays,
 * and the account the actions (`garmin-stub-actions-page-script`) mutate.
 *
 * State lives in `localStorage`, so every page of a browser context shares
 * one Garmin account and a reload keeps it — what two tabs (AC-30) and a
 * reload mid-schedule (AC-29) need. An action commits on receipt, before
 * its delay, like a POST whose answer never came back. An injected failure
 * answers instead of the action; with `commit` the action lands first. A
 * held action commits too, but answers only once the test releases it
 * (`releaseGarminStub`), in whichever page sent it.
 */
import type {
  StubCalendar,
  StubEntry,
} from "./garmin-stub-actions-page-script";

export type StubFailure = {
  response: Record<string, unknown>;
  commit?: boolean;
};

export type GarminCalendarStubArgs = {
  failures: Record<string, StubFailure[]>;
  delays: Record<string, number>;
  holds: readonly string[];
};

export type GarminStubState = StubCalendar & {
  log: { action: string; payload: Record<string, unknown> }[];
  failures: Record<string, StubFailure[]>;
};

export type { StubEntry };

export const GARMIN_STUB_STATE_KEY = "__GARMIN_STUB_STATE__";
export const GARMIN_STUB_RELEASE_KEY = "__GARMIN_STUB_RELEASED__";

export const installGarminCalendarStubScript = (
  args: GarminCalendarStubArgs
): void => {
  type Msg = Record<string, unknown>;
  type Action = (s: GarminStubState, m: Msg) => unknown;
  const KEY = "__GARMIN_STUB_STATE__";
  const RELEASE_KEY = "__GARMIN_STUB_RELEASED__";
  const RELEASE_POLL_MS = 50;
  const released = () =>
    new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        if (!localStorage.getItem(RELEASE_KEY)) return;
        clearInterval(timer);
        resolve();
      }, RELEASE_POLL_MS);
    });
  const load = (): GarminStubState =>
    (JSON.parse(
      localStorage.getItem(KEY) ?? "null"
    ) as GarminStubState | null) ?? {
      nextId: 1_700_000_001,
      entries: [],
      log: [],
      failures: args.failures,
    };
  const w = window as unknown as Record<string, unknown>;
  w.__GARMIN_STUB__ = {
    handle: (action: string, msg: Msg) => {
      const actions = w.__GARMIN_STUB_ACTIONS__ as Record<string, Action>;
      const run = actions?.[action];
      if (!run) return undefined;
      const s = load();
      s.log.push({ action, payload: msg });
      const failure = s.failures[action]?.shift();
      const answer = !failure || failure.commit ? run(s, msg) : undefined;
      localStorage.setItem(KEY, JSON.stringify(s));
      const response = failure ? failure.response : answer;
      const ready = args.holds.includes(action) ? released() : undefined;
      return { response, delayMs: args.delays[action] ?? 0, ready };
    },
  };
};
