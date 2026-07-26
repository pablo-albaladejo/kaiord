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
};

export type SessionProber = (
  extensionId: string
) => Promise<SessionProbeResult>;

export const inactive = (
  error: string | null = null,
  needsReauth = false
): SessionProbeResult => ({ sessionActive: false, error, needsReauth });

export const active = (): SessionProbeResult => ({
  sessionActive: true,
  error: null,
  needsReauth: false,
});
