import type { KRDSession } from "../../../domain/schemas/krd/session";
import { fitSessionSchema, type FitSession } from "../schemas/fit-session";
import { mapFitSessionToKrd } from "./session.mapper";

/**
 * Converts a FIT SESSION message to KRD session format.
 *
 * @param data - Raw FIT SESSION message data
 * @returns KRD session object
 * @throws Error if FIT data is invalid
 */
export const convertFitToKrdSession = (
  data: Record<string, unknown>
): KRDSession => {
  const fitSession = fitSessionSchema.parse(data) as FitSession;
  return mapFitSessionToKrd(fitSession);
};
