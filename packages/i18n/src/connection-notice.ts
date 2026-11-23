import notices, {
  type ConnectionFix,
  type ConnectionNotice,
  type ConnectionReason as SignInReason,
  type ConnectionState,
  type NotCheckedReason,
  type NoTabNotice,
  type ReasonNotice,
} from "./generated/connection-notices.js";
import type { Locale } from "./types";

export type {
  ConnectionFix,
  ConnectionNotice,
  ConnectionState,
  NotCheckedReason,
  NoTabNotice,
  ReasonNotice,
};

/**
 * Why a Connection that looks signed in cannot serve: a reason worded by the
 * shared notices with one of the four fixes, or "no-tab", the one documented
 * exception, whose fix opens the Platform's own tab.
 */
export type ConnectionReason = SignInReason | "no-tab";

/** A notice as the athlete reads it: one of the four fixes, or Open. */
export type ShownNotice = ConnectionNotice | NoTabNotice;

/** The closed set of fixes, in the order the athlete would need them. */
export const CONNECTION_FIXES: readonly ConnectionFix[] = notices.FIXES;

/**
 * The notice a Connection in `state` shows on `platform`, or `null` when it
 * works (or is still being checked). The same function every extension popup
 * calls, so the App and a popup cannot word one state two ways.
 */
export const connectionNotice = (
  state: ConnectionState,
  platform: string,
  locale: Locale
): ConnectionNotice | null => notices.noticeFor(state, platform, locale);

/** The fix a state offers, without its wording. */
export const connectionFix = (state: ConnectionState): ConnectionFix | null =>
  notices.fixFor(state);

/** The notice of a Connection that looks signed in but cannot serve. */
export function connectionReasonNotice(
  reason: SignInReason,
  platform: string,
  locale: Locale
): ReasonNotice;
export function connectionReasonNotice(
  reason: ConnectionReason,
  platform: string,
  locale: Locale
): ReasonNotice | NoTabNotice;
export function connectionReasonNotice(
  reason: ConnectionReason,
  platform: string,
  locale: Locale
): ReasonNotice | NoTabNotice {
  if (reason === "no-tab") return notices.noTabNotice(platform, locale);
  return notices.noticeForReason(reason, platform, locale) as ReasonNotice;
}

/** Why a check asked the Platform nothing, worded for that Platform. */
export const connectionNotCheckedText = (
  reason: NotCheckedReason,
  platform: string,
  locale: Locale
): string => notices.notCheckedFor(reason, platform, locale) as string;

/** The one exception to the four fixes: open the Platform's own tab. */
export const connectionNoTabNotice = (
  platform: string,
  locale: Locale
): NoTabNotice => notices.noTabNotice(platform, locale);
