/**
 * Kaiord for WHOOP — Personal fields removed from every answer
 *
 * The one place this extension declares the personal fields of
 * WHOOP's answers that no Connector reads; `bridge-answer.js`
 * removes them by name from every answer handed to the Kaiord App, after
 * the Session secrets. Names compare in lower case without `_` or `-`
 * (`birth_date` also removes `birthDate`).
 *
 * Derived from what the Connector reads, which stays: cycles (strain, recovery, sleeps), the heart-rate series, sports, biomarker tests and their summaries, and stress, as @kaiord/whoop reads them.
 *
 *   - json: Profile and body-measurement members WHOOP may add beside the data (a lab test's patient, height, weight); no Connector reads them from these answers, while a workout's `max_heart_rate`, which @kaiord/whoop reads, is not on the list.
 *   - html: form controls by name. WHOOP answers JSON; a page in its place keeps no personal form field.
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
    "patient_name",
    "height",
    "height_meter",
    "weight_kilogram",
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
