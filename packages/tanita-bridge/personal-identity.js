/**
 * Kaiord Bridge Core — Identity and contact fields (vendored)
 *
 * Master: packages/_shared/bridge-core/personal-identity.js. Never edit a
 * vendored copy — edit the master and run `pnpm bridge:sync`
 * (parity guard: scripts/check-bridge-core-parity.test.mjs).
 *
 * The personal fields every extension removes from every answer, as a JSON
 * member and as an HTML form control: a person's name, contact details,
 * birth date and gender. No Connector reads them. Each extension's
 * `personal-fields.js` adds its Platform's own fields to this list.
 *
 * This module holds ZERO identity of a bridge: no host names, bridge ids or
 * paths.
 */

const bridgePersonalIdentity = Object.freeze([
  "first_name",
  "last_name",
  "surname",
  "full_name",
  "email",
  "phone",
  "phone_number",
  "mobile",
  "address",
  "street",
  "city",
  "zip",
  "postal_code",
  "birthday",
  "birth_date",
  "date_of_birth",
  "dob",
  "gender",
  "sex",
]);

if (typeof module !== "undefined") {
  module.exports = bridgePersonalIdentity;
}

if (typeof self !== "undefined" && typeof module === "undefined") {
  self.bridgePersonalIdentity = bridgePersonalIdentity;
}
