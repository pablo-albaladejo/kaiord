/**
 * The Garmin send tool's error codes and messages for a Phase 1 failure.
 * The model reads them, never the athlete, and the tool contract fixes
 * them in English; the model words its own answer to the athlete.
 */
export const PACE_ZONE_ERRORS = {
  "missing-pace-zones": {
    error: "missing_pace_zones",
    message:
      "The workout uses pace zone targets, but the athlete's profile has neither pace zones nor a threshold pace for its sport. Ask the athlete to set their threshold pace in Athlete, then send it again.",
  },
  "incomplete-pace-zones": {
    error: "incomplete_pace_zones",
    message:
      "The workout uses a pace zone the athlete's own pace zones do not define. Ask the athlete to complete their pace zones in Athlete, then send it again.",
  },
  "unsupported-pace-zone-sport": {
    error: "unsupported_pace_zone_sport",
    message:
      "Pace zone targets can only be sent to Garmin in a running or swimming workout. Use pace ranges instead of zones for this sport.",
  },
} as const;

export const FTP_ERRORS = {
  "missing-ftp": {
    error: "missing_ftp",
    message:
      "The workout has %FTP power targets, but the athlete's profile has no FTP for its sport. Ask the athlete to set their FTP in Athlete, then send it again.",
  },
  "sport-without-power-zones": {
    error: "sport_without_power_zones",
    message:
      "The workout has %FTP power targets, but its sport has no power zones. Ask the athlete to change its sport to cycling or running.",
  },
} as const;

export const MAX_HR_ERRORS = {
  "missing-max-hr": {
    error: "missing_max_hr",
    message:
      "The workout has %max HR heart-rate targets, but the athlete's profile has no max heart rate. Ask the athlete to set their max heart rate in Athlete, then send it again.",
  },
} as const;
