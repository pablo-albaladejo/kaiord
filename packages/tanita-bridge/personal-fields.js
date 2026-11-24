/**
 * Kaiord for Tanita — Personal fields removed from every answer
 *
 * The one place this extension declares the personal fields of
 * Tanita's answers that no Connector reads; `bridge-answer.js`
 * removes them by name from every answer handed to the Kaiord App, after
 * the Session secrets. Names compare in lower case without `_` or `-`
 * (`birth_date` also removes `birthDate`).
 *
 * Derived from what the Connector reads, which stays: the export CSV's measurement columns, by header.
 *
 *   - json: MyTANITA answers CSV, which carries only measurements and is handed over as it came: dropping a column would be reading it.
 *   - html: form controls by name. A sign-in page MyTANITA serves in place of the export keeps no personal form field (a prefilled email, for example).
 *
 * The common part is identity and contact details.
 */

const bridgePersonalFields = Object.freeze({
  json: Object.freeze([
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
  ]),
  html: Object.freeze([
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
  ]),
});

if (typeof module !== "undefined") {
  module.exports = bridgePersonalFields;
}

if (typeof self !== "undefined" && typeof module === "undefined") {
  self.bridgePersonalFields = bridgePersonalFields;
}
