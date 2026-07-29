/**
 * The copy every `attention` surface renders may not diagnose a cause no probe
 * can observe — in EVERY locale, which is why this reads the JSON catalogs
 * rather than one rendered surface.
 *
 * The claim being forbidden: `probeGarminSession` reads a single boolean
 * (`gcApi.ok`) that `checkSession` sets false for an unusable token, a Garmin
 * 5xx and a network blip alike; train2go's `ping` degrades every throw to
 * `sessionActive: false` by its own comment; `probeWhoopSession` folds every
 * delivered error into `inactive()`. None of them can name a cause. Garmin
 * makes the sign-out reading not merely unsupported but false: its bearer is
 * minted from a long-lived OAuth1 token in `chrome.storage.local`, so reads
 * outlive signing out of connect.garmin.com.
 *
 * The regexes are asserted to MATCH the wording this replaced, so a guard
 * weakened into uselessness fails here instead of passing quietly.
 */
import type { NamespaceDictionary } from "@kaiord/i18n";
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

const LOCALES = [...new Set(Object.keys(MODULES).map(localeOf))];

/** Every surface that words the same undiagnosable failure. */
const ATTENTION_COPY: readonly (readonly [string, string])[] = [
  ["connections", "status.attention"],
  ["connections", "detail.noAccess"],
  ["connections", "banner.one"],
  ["common", "sourceHealth.noAccess"],
];

/**
 * `attentionCauseText` renders `sourceHealth.<cause.kind>` for every member of
 * `AttentionCause`, so the catalog grows whenever a cause does — while the list
 * above does not. A cause exempted here must say what earns the exemption; the
 * only two that do are the ones whose wording is not an inference.
 */
const UNGUARDED_CAUSES: Readonly<Record<string, string>> = {
  extensionOutdated:
    "Names an observable fact: `outdated` is set only by probeByPing comparing the reported protocolVersion, so the cause is measured rather than guessed.",
  noNewDataSince:
    "Reports the date of the last delivery and attributes the silence to nothing.",
};

// Punctuation-free and case-insensitive on purpose: a guard pinned to
// "signed out," survives "…you may be signed out." unchanged, and one pinned
// to "session" misses "Session".
const SIGNED_OUT =
  /sign(?:ed|ing)?[\s-]*out|signout|sesi[oó]n\s+(?:cerrada|finalizada)|cerr\w*\s+(?:la\s+)?sesi[oó]n/i;
const EXPIRED = /expir|caduc/i;
// The second falsehood in the sentence this replaced: it promised the
// extension "picks the session back up on its own". Garmin's bridge holds no
// browser session to pick back up, so nothing recovers unattended.
const SELF_RECOVERY = /on its own|by itself|automatic|autom[aá]tic|sol[oa]\b/i;
const SIGN_IN_ACTION = /sign(?:ing)?\s+in\b|inicia\w*\s+sesi[oó]n/i;
const OUTAGE = /unavailable|no\s+est[eé]\s+disponible/i;

/** The exact wording removed, in both shipped languages. */
const REPLACED = [
  "Session signed out",
  "Sesión cerrada",
  "{{name}} is signed out",
  "{{name}} tiene la sesión cerrada",
  "Session signed out — sign in again to resume",
  "Sesión cerrada: vuelve a iniciar sesión para reanudar",
  "Open the provider's site and sign in; the extension picks the session back up on its own.",
  "Abre la web del proveedor e inicia sesión; la extensión recupera la sesión sola.",
  "you may be signed out.",
  "this source is signed-out",
  "the session expired",
  "la sesión ha caducado",
];

describe("attention copy honesty", () => {
  it.each(LOCALES)(
    "should never diagnose a signed-out session in %s",
    (locale) => {
      // Arrange
      const paths = ATTENTION_COPY.map(
        ([ns, key]) => [`./locales/${locale}/${ns}.json`, key] as const
      );

      // Act
      const texts = paths.map(([path, key]) => read(path, key));

      // Assert
      for (const text of texts) expect(text).not.toMatch(SIGNED_OUT);
    }
  );

  it.each(LOCALES)(
    "should never claim a credential expired in %s",
    (locale) => {
      // Arrange
      const paths = ATTENTION_COPY.map(
        ([ns, key]) => [`./locales/${locale}/${ns}.json`, key] as const
      );

      // Act
      const texts = paths.map(([path, key]) => read(path, key));

      // Assert
      for (const text of texts) expect(text).not.toMatch(EXPIRED);
    }
  );

  it.each(LOCALES)(
    "should never promise the extension recovers unattended in %s",
    (locale) => {
      // Arrange
      const paths = ATTENTION_COPY.map(
        ([ns, key]) => [`./locales/${locale}/${ns}.json`, key] as const
      );

      // Act
      const texts = paths.map(([path, key]) => read(path, key));

      // Assert
      for (const text of texts) expect(text).not.toMatch(SELF_RECOVERY);
    }
  );

  it.each(LOCALES)(
    "should keep offering a sign-in and name an outage beside it in %s",
    (locale) => {
      // Arrange
      // Re-signing in genuinely re-mints Garmin's access, so it stays the
      // useful action — only the diagnosis attached to it was wrong. Naming
      // the outage beside it is what stops the action reading as a diagnosis.
      const detail = read(
        `./locales/${locale}/connections.json`,
        "detail.noAccess"
      );

      // Act
      const offersSignIn = SIGN_IN_ACTION.test(detail);

      // Assert
      expect(offersSignIn).toBe(true);
      expect(detail).toMatch(OUTAGE);
    }
  );

  it("should reject the wording it replaced, so the guards have teeth", () => {
    // Arrange
    // Without this, softening SIGNED_OUT to /\bsigned out,/ would pass every
    // assertion above while letting the original claim straight back in.
    const causeClaims = REPLACED;

    // Act
    const caught = causeClaims.filter(
      (text) =>
        SIGNED_OUT.test(text) || EXPIRED.test(text) || SELF_RECOVERY.test(text)
    );

    // Assert
    expect(caught).toEqual(causeClaims);
  });

  it("should not mistake an offer to sign in for a sign-out claim", () => {
    // Arrange
    // The inverse failure: a guard broad enough to reject its own replacement
    // would force the CTA out, which is the one part that was never wrong.
    const kept = [
      "Signing in again on its site restores access",
      "Volver a iniciar sesión en su web restaura el acceso",
    ];

    // Act
    const flagged = kept.filter((text) => SIGNED_OUT.test(text));

    // Assert
    expect(flagged).toEqual([]);
  });

  it.each(LOCALES)(
    "should guard or exempt every rendered attention cause in %s",
    (locale) => {
      // Arrange
      // The guarded list is fixed while the causes are a union that can grow.
      // Without this, a fourth cause ships copy no assertion above ever reads,
      // and that omission looks exactly like coverage.
      const guarded = new Set(
        ATTENTION_COPY.filter(([ns]) => ns === "common").map(([, key]) =>
          key.slice("sourceHealth.".length)
        )
      );
      const catalog = MODULES[`./locales/${locale}/common.json`] as
        Record<string, Record<string, string> | undefined> | undefined;

      // Act
      const unaccounted = Object.keys(catalog?.sourceHealth ?? {}).filter(
        (cause) => !guarded.has(cause) && UNGUARDED_CAUSES[cause] === undefined
      );

      // Assert
      expect(unaccounted).toEqual([]);
    }
  );
});
