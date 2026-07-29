/**
 * Session-probe contract shared by every bridge prober.
 *
 * A prober NEVER throws: transport failures, dead cookie sessions and
 * protocol mismatches are all folded into the result so the connection
 * store can render one uniform state per bridge.
 */

export type SessionProbeResult = {
  /** Did the extension answer? `false` means it is gone, not signed out. */
  reachable: boolean;
  sessionActive: boolean;
  error: string | null;
  needsReauth: boolean;
};

export type SessionProber = (
  extensionId: string
) => Promise<SessionProbeResult>;

export const inactive = (
  error: string | null = null,
  needsReauth = false
): SessionProbeResult => ({
  reachable: true,
  sessionActive: false,
  error,
  needsReauth,
});

export const active = (): SessionProbeResult => ({
  reachable: true,
  sessionActive: true,
  error: null,
  needsReauth: false,
});

/**
 * The extension did not answer. Reported apart from `inactive` because the
 * two need opposite copy: a dead session says "sign in again", a missing
 * extension cannot be fixed by signing in anywhere.
 */
export const unreachable = (
  error: string | null = null
): SessionProbeResult => ({
  reachable: false,
  sessionActive: false,
  error,
  needsReauth: false,
});
