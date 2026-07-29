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
  /**
   * The extension answered, but spoke an unsupported protocol version. The
   * probe SUCCEEDED — this is a diagnosis, not a failure — so a consumer must
   * be able to tell it apart from an unreachable bridge and say "update the
   * extension" instead of "the check failed".
   */
  outdated: boolean;
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
  outdated: false,
});

/** Reachable on purpose: the extension ANSWERED, just in a protocol this
    build does not speak. Reporting it as gone would offer the wrong fix. */
export const outdatedExtension = (error: string): SessionProbeResult => ({
  reachable: true,
  sessionActive: false,
  error,
  needsReauth: false,
  outdated: true,
});

export const active = (): SessionProbeResult => ({
  reachable: true,
  sessionActive: true,
  error: null,
  needsReauth: false,
  outdated: false,
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
  outdated: false,
});
