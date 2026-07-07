/**
 * stampProvenance — single constructor for the provenance shape stamped
 * on every health record write, regardless of entry path. FIT import
 * and manual entry both call this so the shape can never drift between
 * paths: uniformity is structural, not just verified by tests.
 *
 * Callers derive `externalId` however fits their own semantics (a
 * content-hash of the payload for FIT, a hash of metric+day for manual)
 * and pass the result here to get the shared, uniform shape.
 */
export type Provenance = {
  sourceBridgeId: string;
  externalId: string;
};

export const stampProvenance = (
  sourceBridgeId: string,
  externalId: string
): Provenance => ({ sourceBridgeId, externalId });
