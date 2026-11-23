export type ConnectionFix = "install" | "update" | "sign-in" | "try-again";

export type ConnectionState =
  | "working"
  | "checking"
  | "not-checked"
  | "not-installed"
  | "outdated"
  | "signed-out"
  | "not-answering";

export type NoticeLocale = "en" | "es";

export type NoticeWording = {
  readonly message: string;
  readonly action: string;
};

export type ConnectionNotice = NoticeWording & { readonly fix: ConnectionFix };

/** A Connection that looks signed in but cannot serve. */
export type ConnectionReason = "no-account-id";

export type ReasonNotice = ConnectionNotice & {
  readonly reason: ConnectionReason;
};

/** Why a check asked the Platform nothing. */
export type NotCheckedReason = "would-mint-token" | "no-token-captured";

/** The one exception to the four fixes: open the Platform's own tab. */
export type NoTabNotice = NoticeWording & { readonly fix: "open-platform" };

declare const KAIORD_CONNECTION_NOTICES: {
  readonly FIXES: readonly ConnectionFix[];
  readonly FIX_FOR_STATE: Readonly<
    Record<ConnectionState, ConnectionFix | null>
  >;
  readonly WORDING: Readonly<
    Record<NoticeLocale, Readonly<Record<ConnectionFix, NoticeWording>>>
  >;
  readonly REASONS: Readonly<Record<ConnectionReason, ConnectionFix>>;
  readonly REASON_WORDING: Readonly<
    Record<NoticeLocale, Readonly<Record<ConnectionReason, string>>>
  >;
  readonly NOT_CHECKED: Readonly<
    Record<NoticeLocale, Readonly<Record<NotCheckedReason, string>>>
  >;
  readonly NO_TAB: Readonly<Record<NoticeLocale, NoticeWording>>;
  readonly fixFor: (state: string) => ConnectionFix | null;
  readonly noticeFor: (
    state: string,
    platform: string,
    locale: string
  ) => ConnectionNotice | null;
  readonly noticeForReason: (
    reason: string,
    platform: string,
    locale: string
  ) => ReasonNotice | null;
  readonly notCheckedFor: (
    reason: string,
    platform: string,
    locale: string
  ) => string | null;
  readonly noTabNotice: (platform: string, locale: string) => NoTabNotice;
};

export default KAIORD_CONNECTION_NOTICES;
