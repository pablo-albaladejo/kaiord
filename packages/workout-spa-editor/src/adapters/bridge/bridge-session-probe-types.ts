/**
 * Session-probe contract shared by every bridge prober.
 *
 * A prober NEVER throws: transport failures, dead cookie sessions and
 * protocol mismatches are all folded into the result so the connection
 * store can render one uniform state per bridge.
 */

export type SessionProbeResult = {
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
  sessionActive: false,
  error,
  needsReauth,
  outdated: false,
});

export const outdatedExtension = (error: string): SessionProbeResult => ({
  sessionActive: false,
  error,
  needsReauth: false,
  outdated: true,
});

export const active = (): SessionProbeResult => ({
  sessionActive: true,
  error: null,
  needsReauth: false,
  outdated: false,
});
