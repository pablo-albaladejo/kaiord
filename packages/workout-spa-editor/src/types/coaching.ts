/**
 * Coaching Domain - Types Barrel
 *
 * Re-exports types and schemas for linked coaching accounts, coaching activity
 * records (with their status enum), and per-account coaching sync state.
 */

// ============================================
// Coaching Account
// ============================================

export type { LinkedCoachingAccount } from "./coaching-account";
export {
  linkCoachingAccount,
  linkedCoachingAccountSchema,
  unlinkCoachingAccount,
} from "./coaching-account";

// ============================================
// Coaching Activity Record
// ============================================

export type {
  CoachingActivityRecord,
  CoachingActivityStatus,
} from "./coaching-activity-record";
export {
  buildCoachingActivityId,
  coachingActivityRecordSchema,
  coachingActivityStatusSchema,
  namespaceSourceId,
} from "./coaching-activity-record";

// ============================================
// Coaching Sync State
// ============================================

export type { CoachingSyncStateRecord } from "./coaching-sync-state";
export { coachingSyncStateRecordSchema } from "./coaching-sync-state";
