/**
 * Kaiord for Garmin — Personal fields removed from every answer
 *
 * The one place this extension declares the personal fields of
 * Garmin's answers that no Connector reads; `bridge-answer.js`
 * removes them by name from every answer handed to the Kaiord App, after
 * the Session secrets. Names compare in lower case without `_` or `-`
 * (`birth_date` also removes `birthDate`).
 *
 * Derived from what the Connector reads, which stays: a workout's `workoutId` and the workout itself (steps, sport, name) read by @kaiord/garmin; an activity's `activityId`, `activityName`, start times, `activityType`, `distance` and `duration`; a calendar item's `itemType`, `workoutId`, `id` and `date`; a placement's `workoutScheduleId`.
 *
 *   - json: A workout's `author` (display name, full name, profile images), an activity's owner names and pictures, where it started and ended, and the people a workout is shared with.
 *   - html: form controls by name. Garmin answers JSON; a page in its place keeps no personal form field.
 *
 * The common part, identity and contact details, is the vendored
 * `personal-identity.js`.
 */

// Wrapped so its names never meet a worker's other top-level declarations:
// importScripts shares one global lexical scope.
const bridgePersonalFields = (() => {
  // Identity and contact details: the vendored list every extension shares,
  // loaded before this file (importScripts), or required under Node.
  const identity =
    typeof require !== "undefined"
      ? require("./personal-identity.js")
      : globalThis.bridgePersonalIdentity;
  return Object.freeze({
    json: Object.freeze([
      ...identity,
      "author",
      "display_name",
      "owner_display_name",
      "owner_full_name",
      "owner_profile_image_url_small",
      "owner_profile_image_url_medium",
      "owner_profile_image_url_large",
      "shared_with_users",
      "start_latitude",
      "start_longitude",
      "end_latitude",
      "end_longitude",
      "location_name",
    ]),
    html: Object.freeze([...identity]),
  });
})();

if (typeof module !== "undefined") {
  module.exports = bridgePersonalFields;
}

if (typeof self !== "undefined" && typeof module === "undefined") {
  self.bridgePersonalFields = bridgePersonalFields;
}
