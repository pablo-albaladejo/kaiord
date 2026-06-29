export const GARMIN_SSO_ORIGIN = "https://sso.garmin.com";
export const GARMIN_SSO_EMBED = "https://sso.garmin.com/sso/embed";
export const SIGNIN_URL = "https://sso.garmin.com/sso/signin";
const API_BASE = "https://connectapi.garmin.com";
export const OAUTH_URL = `${API_BASE}/oauth-service/oauth`;
export const WORKOUT_URL = `${API_BASE}/workout-service`;
/** OAuth consumer credentials hosted by the garth project (third-party). */
export const OAUTH_CONSUMER_URL =
  "https://thegarth.s3.amazonaws.com/oauth_consumer.json";

export const USER_AGENT_MOBILE = "com.garmin.android.apps.connectmobile";
export const USER_AGENT_SSO = "GCM-iOS-5.7.2.1";

/** Garmin Connect web URL for a pushed workout (used in push result). */
export const garminWorkoutWebUrl = (id: string | number): string =>
  `https://connect.garmin.com/modern/workout/${id}`;
