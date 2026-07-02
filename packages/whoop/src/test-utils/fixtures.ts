import type { WhoopRecoveryRecord } from "../adapters/schemas/whoop-recovery.schema";
import type { WhoopSleepRecord } from "../adapters/schemas/whoop-sleep.schema";

/**
 * Representative WHOOP v2 API responses, trimmed to the fields the adapter
 * consumes. Values mirror the shapes documented at developer.whoop.com.
 */

export const SCORED_RECOVERY: WhoopRecoveryRecord = {
  cycle_id: 93845,
  sleep_id: "ecfc6a15-4661-4d5c-8f2a-1b2c3d4e5f60",
  user_id: 10129,
  created_at: "2026-04-24T11:25:44.774Z",
  updated_at: "2026-04-24T14:25:44.774Z",
  score_state: "SCORED",
  score: {
    user_calibrating: false,
    recovery_score: 44,
    resting_heart_rate: 64,
    hrv_rmssd_milli: 31.813562,
  },
};

export const UNSCORED_RECOVERY: WhoopRecoveryRecord = {
  cycle_id: 93846,
  sleep_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  created_at: "2026-04-25T11:25:44.774Z",
  score_state: "PENDING_SCORE",
};

export const SCORED_SLEEP: WhoopSleepRecord = {
  id: "ecfc6a15-4661-4d5c-8f2a-1b2c3d4e5f60",
  cycle_id: 93845,
  user_id: 10129,
  start: "2026-04-24T02:25:44.774Z",
  end: "2026-04-24T10:25:44.774Z",
  nap: false,
  score_state: "SCORED",
  score: {
    stage_summary: {
      total_in_bed_time_milli: 28_809_573,
      total_awake_time_milli: 1_403_507,
      total_no_data_time_milli: 0,
      total_light_sleep_time_milli: 14_905_851,
      total_slow_wave_sleep_time_milli: 6_630_370,
      total_rem_sleep_time_milli: 5_869_845,
    },
    sleep_performance_percentage: 98,
  },
};

export const UNSCORED_SLEEP: WhoopSleepRecord = {
  id: "ffffffff-1111-2222-3333-444444444444",
  start: "2026-04-25T02:25:44.774Z",
  end: "2026-04-25T10:25:44.774Z",
  score_state: "PENDING_SCORE",
};
