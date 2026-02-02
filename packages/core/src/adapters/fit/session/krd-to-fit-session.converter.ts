import { krdSessionSchema, type KRDSession } from "../../../domain/schemas/krd";
import type { FitSession } from "../schemas/fit-session";
import { mapKrdSessionToFit } from "./session.mapper";

/**
 * Converts a KRD session to FIT SESSION message format.
 *
 * @param data - KRD session object
 * @returns Partial FIT SESSION message data
 * @throws Error if KRD data is invalid
 */
export const convertKrdToFitSession = (
  data: Record<string, unknown>
): Partial<FitSession> => {
  const krdSession = krdSessionSchema.parse(data) as KRDSession;
  return mapKrdSessionToFit(krdSession);
};
