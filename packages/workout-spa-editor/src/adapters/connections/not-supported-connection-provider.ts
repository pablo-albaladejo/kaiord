/**
 * Connection provider for brands without a connect mechanism yet (Strava,
 * Wahoo). Reports `not-supported` and refuses to connect — the UI renders an
 * honest "not supported yet" state instead of a fake connect flow (#714).
 */
import type { ConnectionProvider } from "../../application/connections/connection-provider.port";
import type { ConnectionRecord } from "../../types/connection";

export const createNotSupportedConnectionProvider = (
  providerId: string
): ConnectionProvider => ({
  providerId,
  status: async () => "not-supported",
  connect: async (): Promise<ConnectionRecord> => {
    throw new Error(`Connecting ${providerId} is not supported yet`);
  },
  disconnect: async () => undefined,
});
