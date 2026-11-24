/**
 * What `check-bridge-popup-reads.mjs` lets a bridge keep in `chrome.storage`.
 *
 * ADR 0004's bounded exception lets a working extension's popup read and
 * interpret data for its own window, when the athlete opens it, without
 * storing it beyond the popup's lifetime. So a bridge writes only the keys
 * below, each with the reason it is not popup-read data; any other key, or a
 * write whose keys cannot be read from the source, fails the guard.
 */

const SHARED = {
  bridgeHealth:
    "the popup's own state: when its Session check last could and could not reach the Platform, to date a notice (no Platform data)",
  kaiordTheme:
    "the Kaiord App's theme preference, sent by the App (`set-theme`), so the popup paints in it",
};

const APP_PROFILE = {
  profileSnapshot:
    "the profile summary the Kaiord App sends (`profile-snapshot`) for the popup's athlete card, not read from the Platform",
  lastPushReceipt:
    "the time and name of the last profile summary the Kaiord App sent",
  bridgeTelemetry:
    "a capped log of the last 25 errors the extension handled without failing: an action name and an error message, no Platform data",
};

export const STORAGE_KEYS = {
  "garmin-bridge": {
    ...SHARED,
    ...APP_PROFILE,
    garminOAuth1:
      "the OAuth1 token minted from the athlete's Garmin sign-in; sent only to Garmin, never to the App",
    garminOAuth2:
      "the OAuth2 access token renewed from the OAuth1 token; sent only to Garmin, never to the App",
  },
  "tanita-bridge": { ...SHARED },
  "train2go-bridge": { ...SHARED, ...APP_PROFILE },
  "trainingpeaks-bridge": {
    ...SHARED,
    tpAccessToken:
      "the short-lived TrainingPeaks access token, its expiry and the athlete number it was minted for; the token is sent only to TrainingPeaks",
  },
  "whoop-bridge": {
    ...SHARED,
    whoopToken:
      "the session bearer captured from the athlete's WHOOP tab, in memory-only session storage; never handed to the App",
    whoopUserId:
      "the WHOOP account id decoded from that bearer, which the read paths need",
    whoopCapturedAt: "when the bearer was captured",
  },
};
