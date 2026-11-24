/**
 * Kaiord for TrainingPeaks — Personal fields removed from every answer
 *
 * The one place this extension declares the personal fields of
 * TrainingPeaks's answers that no Connector reads; `bridge-answer.js`
 * removes them by name from every answer handed to the Kaiord App, after
 * the Session secrets. Names compare in lower case without `_` or `-`
 * (`birth_date` also removes `birthDate`).
 *
 * Derived from what the Connector reads, which stays: a metric entry's `timeStamp` and `details` (`type`, `value`) read by @kaiord/trainingpeaks; a workout's `workoutId` and `workoutDay`.
 *
 *   - json: A workout's comments (the coach's and the athlete's), which the Connector never reads; metric types other than weight are values, not names, and stay (dropping them would be reading the answer).
 *   - html: form controls by name. TrainingPeaks answers JSON; a page in its place keeps no personal form field.
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
    "username",
    "coach_comments",
    "workout_comments",
    "new_comment",
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
