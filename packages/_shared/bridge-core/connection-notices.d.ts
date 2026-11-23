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

declare const KAIORD_CONNECTION_NOTICES: {
  readonly FIXES: readonly ConnectionFix[];
  readonly FIX_FOR_STATE: Readonly<
    Record<ConnectionState, ConnectionFix | null>
  >;
  readonly WORDING: Readonly<
    Record<NoticeLocale, Readonly<Record<ConnectionFix, NoticeWording>>>
  >;
  readonly EXTENSION_LOCALE: NoticeLocale;
  readonly fixFor: (state: string) => ConnectionFix | null;
  readonly noticeFor: (
    state: string,
    platform: string,
    locale: string
  ) => ConnectionNotice | null;
};

export default KAIORD_CONNECTION_NOTICES;
