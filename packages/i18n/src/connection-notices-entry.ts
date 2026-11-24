/**
 * `@kaiord/i18n/connection-notices`: the shared Connection notices, apart
 * from the translator entry. The notices table is built when its module
 * loads, so keeping it out of `@kaiord/i18n` lets a consumer that only needs
 * a locale or `createTranslator` (the App's first load, the CLI) not ship it.
 */
export {
  CONNECTION_FIXES,
  connectionFix,
  connectionNoTabNotice,
  connectionNotCheckedText,
  connectionNotice,
  connectionReasonNotice,
  type ConnectionFix,
  type ConnectionNotice,
  type ConnectionReason,
  type ConnectionState,
  type NotCheckedReason,
  type NoTabNotice,
  type ReasonNotice,
  type ShownNotice,
} from "./connection-notice";
