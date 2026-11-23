import type { CapabilityDecision } from "../types/capability-decision";

/** Per-(profile, Capability) decisions, keyed `[profileId+capabilityId]`. */
export type CapabilityDecisionRepository = {
  listByProfile: (profileId: string) => Promise<CapabilityDecision[]>;
  put: (decision: CapabilityDecision) => Promise<void>;
  /** Bulk-delete every decision of a profile (profile-delete cascade). */
  deleteByProfile: (profileId: string) => Promise<void>;
};
