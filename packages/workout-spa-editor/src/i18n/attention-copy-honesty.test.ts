/**
 * The copy every `attention` surface renders may not diagnose a cause no probe
 * can observe — in EVERY locale.
 *
 * Since the four Connection fixes moved to one source (`connectionNotice`,
 * `@kaiord/i18n`), the words a broken Connection shows are that source's, so
 * this reads it for every state the App reaches, plus the few summary strings
 * the App's own dictionaries still carry beside it. "not-answering" is what
 * every check that could not tell why becomes (a Garmin read that failed, a
 * Train2Go ping that degraded, an extension that did not reply): its words may
 * name the outage and nothing else.
 *
 * The regexes are asserted to MATCH the wording this replaced, so a guard
 * weakened into uselessness fails here instead of passing quietly; the pins
 * turn any change to the shipped words into a reviewed change.
 */
import type { NamespaceDictionary } from "@kaiord/i18n";
import {
  connectionNotice,
  type ConnectionState,
} from "@kaiord/i18n/connection-notices";
import { describe, expect, it } from "vitest";

const MODULES = import.meta.glob<NamespaceDictionary>("./locales/*/*.json", {
  eager: true,
  import: "default",
});

const localeOf = (path: string): string => {
  const dir = path.slice(0, path.lastIndexOf("/"));
  return dir.slice(dir.lastIndexOf("/") + 1);
};

const read = (path: string, key: string): string => {
  let current: unknown = MODULES[path];
  for (const segment of key.split(".")) {
    current = (current as Record<string, unknown> | undefined)?.[segment];
  }
  if (typeof current !== "string") {
    throw new Error(`missing ${key} in ${path}`);
  }
  return current;
};

const LOCALES = [...new Set(Object.keys(MODULES).map(localeOf))] as (
  "en" | "es"
)[];

/** The summary strings the attention surfaces still word in the App. */
const ATTENTION_COPY: readonly (readonly [string, string])[] = [
  ["connections", "status.attention"],
  ["connections", "banner.many"],
  ["common", "sourceHealth.several"],
];

const UNVERIFIED: readonly ConnectionState[] = ["not-answering"];

const PINNED: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  en: {
    "connections:status.attention": "No access",
    "connections:banner.many": "{{count}} sources need attention",
    "common:sourceHealth.several": "Each one shows its fix on Connections.",
    "notice:not-answering":
      "Garmin is not answering, so you cannot use it in Kaiord right now. · Try again",
  },
  es: {
    "connections:status.attention": "Sin acceso",
    "connections:banner.many": "{{count}} fuentes necesitan atención",
    "common:sourceHealth.several": "Cada una muestra su arreglo en Conexiones.",
    "notice:not-answering":
      "Garmin no responde, así que ahora mismo no puedes usarlo en Kaiord. · Reintentar",
  },
};

const SIGNED_OUT =
  /sign(?:ed|ing)?[\s-]*out|signout|sesi[oó]n\s+(?:cerrada|finalizada)|cerr\w*\s+(?:la\s+)?sesi[oó]n/i;
const EXPIRED = /expir|caduc/i;
const REVOKED =
  /granted again|revoke|withdraw|no longer authoris|volver a conceder|revocad|ya no est[aá]\s+autoriz/i;
const SELF_RECOVERY = /on its own|by itself|automatic|autom[aá]tic|sol[oa]\b/i;
const SIGN_IN_ACTION = /sign(?:ing)?\s+in\b|inicia\w*\s+sesi[oó]n/i;
const OUTAGE = /not answering|no responde/i;

/** The exact wording removed, in both shipped languages. */
const REPLACED = [
  "Session signed out",
  "Sesión cerrada",
  "{{name}} is signed out",
  "Open the provider's site and sign in; the extension picks the session back up on its own.",
  "Abre la web del proveedor e inicia sesión; la extensión recupera la sesión sola.",
  "Your coaching session expired — reconnect and retry.",
  "Your mytanita.eu session expired — sign in there and try again.",
  "la sesión ha caducado",
  "The extension's access has to be granted again",
];

const surfaceTexts = (locale: "en" | "es"): string[] => [
  ...ATTENTION_COPY.map(([ns, key]) =>
    read(`./locales/${locale}/${ns}.json`, key)
  ),
  ...UNVERIFIED.map((state) => {
    const notice = connectionNotice(state, "Garmin", locale);
    return `${notice?.message ?? ""} · ${notice?.action ?? ""}`;
  }),
];

describe("attention copy honesty", () => {
  it.each(LOCALES)(
    "should never state a cause the check did not verify in %s",
    (locale) => {
      // Arrange
      const forbidden = [SIGNED_OUT, EXPIRED, REVOKED, SELF_RECOVERY];

      // Act
      const texts = surfaceTexts(locale);

      // Assert
      for (const text of texts) {
        for (const claim of forbidden) expect(text).not.toMatch(claim);
      }
    }
  );

  it.each(LOCALES)(
    "should name the outage and offer no sign-in when the cause is unknown in %s",
    (locale) => {
      // Arrange
      const state: ConnectionState = "not-answering";

      // Act
      const notice = connectionNotice(state, "Garmin", locale);

      // Assert
      expect(notice?.fix).toBe("try-again");
      expect(notice?.message).toMatch(OUTAGE);
      expect(`${notice?.message} ${notice?.action}`).not.toMatch(
        SIGN_IN_ACTION
      );
    }
  );

  it("should reject the wording it replaced, so the guards have teeth", () => {
    // Arrange
    const causeClaims = REPLACED;

    // Act
    const caught = causeClaims.filter(
      (text) =>
        SIGNED_OUT.test(text) ||
        EXPIRED.test(text) ||
        SELF_RECOVERY.test(text) ||
        REVOKED.test(text)
    );

    // Assert
    expect(caught).toEqual(causeClaims);
  });

  it.each(LOCALES)(
    "should render exactly the approved wording in %s",
    (locale) => {
      // Arrange
      const expected = PINNED[locale];
      const notice = connectionNotice("not-answering", "Garmin", locale);

      // Act
      const actual = {
        ...Object.fromEntries(
          ATTENTION_COPY.map(([ns, key]) => [
            `${ns}:${key}`,
            read(`./locales/${locale}/${ns}.json`, key),
          ])
        ),
        "notice:not-answering": `${notice?.message} · ${notice?.action}`,
      };

      // Assert
      expect(actual).toEqual(expected);
    }
  );

  it("should pin every locale the app ships", () => {
    // Arrange
    const locales = LOCALES;

    // Act
    const unpinned = locales.filter((locale) => PINNED[locale] === undefined);

    // Assert
    expect(unpinned).toEqual([]);
  });
});
