/**
 * Kaiord for Train2Go — Personal fields removed from every answer
 *
 * The one place this extension declares the personal fields of
 * Train2Go's answers that no Connector reads; `bridge-answer.js`
 * removes them by name from every answer handed to the Kaiord App, after
 * the Session secrets. Names compare in lower case without `_` or `-`
 * (`birth_date` also removes `birthDate`).
 *
 * Derived from what the Connector reads, which stays: the profile ping's `success`, `data.user.id` and `data.user.name`; the weekly and daily plans and comments; on the profile page the zone, pace and power inputs, `weight`, `bpm_max` and `bpm_rest`.
 *
 *   - json: The profile ping's body figures (height, weight, heart rates) are read from the profile page instead, and the coach (`trainer`) and the coach's notes only by the popup's own read.
 *   - html: form controls by name. The profile page's physiological form keeps `weight`, `bpm_max` and `bpm_rest`, which the Connector reads; the rest of that form is personal and unread.
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
      "height",
      "weight",
      "bpm_max",
      "bpm_rest",
      "trainer",
      "user_notes",
    ]),
    html: Object.freeze([
      ...identity,
      "height",
      "fat",
      "imc",
      "smoker",
      "user_notes",
    ]),
  });
})();

if (typeof module !== "undefined") {
  module.exports = bridgePersonalFields;
}

if (typeof self !== "undefined" && typeof module === "undefined") {
  self.bridgePersonalFields = bridgePersonalFields;
}
