/**
 * Kaiord Bridge Core — Connection Notices (vendored)
 *
 * Master: packages/_shared/bridge-core/connection-notices.js. Never edit a
 * vendored copy — edit the master and run `pnpm bridge:sync`.
 *
 * The one source of what the athlete reads when a Connection does not work.
 * A Connection either works, and shows no notice, or shows exactly one of
 * four fixes, each with one wording in English and Spanish. The Kaiord App
 * reads this file through `@kaiord/i18n`; every extension popup loads its
 * byte-identical copy as a classic script. `scripts/check-connection-notices.mjs`
 * fails on a fifth fix, a second wording, or a notice written anywhere else.
 *
 * A cause that was not verified is never stated: every state this table does
 * not know maps to "try-again", whose wording only says the Platform is not
 * answering.
 *
 * Beside the four fixes:
 *   - REASONS: a Connection that looks signed in but cannot serve, worded by
 *     what it stops and resolved by one of the four fixes (its action is
 *     that fix's action, word for word);
 *   - NOT_CHECKED: why a check asked the Platform nothing, one wording per
 *     reason, shown with no notice;
 *   - NO_TAB: the one exception to the four fixes, for a Platform that reads
 *     only through one of its own tabs: the sign-in works, and the fix is to
 *     open the Platform (scripts/check-connection-notices.mjs).
 */

const KAIORD_CONNECTION_NOTICES = (() => {
  const FIXES = Object.freeze(["install", "update", "sign-in", "try-again"]);

  // Verified state of one Connection → the fix it offers. `null` is no notice.
  const FIX_FOR_STATE = Object.freeze({
    working: null,
    checking: null,
    // The check asked the Platform nothing (it would have minted a token or
    // downloaded data); the first real read or send finds out.
    "not-checked": null,
    "not-installed": "install",
    outdated: "update",
    "signed-out": "sign-in",
    "not-answering": "try-again",
  });

  const WORDING = Object.freeze({
    en: Object.freeze({
      install: Object.freeze({
        message:
          "You cannot use {platform} in Kaiord until Kaiord for {platform} is installed in this browser.",
        action: "Install Kaiord for {platform}",
      }),
      update: Object.freeze({
        message:
          "You cannot use {platform} in Kaiord until Kaiord for {platform} is updated.",
        action: "Update Kaiord for {platform}",
      }),
      "sign-in": Object.freeze({
        message:
          "You cannot use {platform} in Kaiord until you sign in to {platform} in this browser.",
        action: "Sign in to {platform}",
      }),
      "try-again": Object.freeze({
        message:
          "{platform} is not answering, so you cannot use it in Kaiord right now.",
        action: "Try again",
      }),
    }),
    es: Object.freeze({
      install: Object.freeze({
        message:
          "No puedes usar {platform} en Kaiord hasta que instales Kaiord for {platform} en este navegador.",
        action: "Instalar Kaiord for {platform}",
      }),
      update: Object.freeze({
        message:
          "No puedes usar {platform} en Kaiord hasta que actualices Kaiord for {platform}.",
        action: "Actualizar Kaiord for {platform}",
      }),
      "sign-in": Object.freeze({
        message:
          "No puedes usar {platform} en Kaiord hasta que inicies sesión en {platform} en este navegador.",
        action: "Iniciar sesión en {platform}",
      }),
      "try-again": Object.freeze({
        message:
          "{platform} no responde, así que ahora mismo no puedes usar {platform} en Kaiord.",
        action: "Reintentar",
      }),
    }),
  });

  // Looks signed in, cannot serve → the fix that resolves it.
  const REASONS = Object.freeze({
    // A sign-in that carries no account id: every import is built on it.
    "no-account-id": "sign-in",
  });

  const REASON_WORDING = Object.freeze({
    en: Object.freeze({
      "no-account-id":
        "You cannot import from {platform} in Kaiord until you sign in to {platform} again in this browser.",
    }),
    es: Object.freeze({
      "no-account-id":
        "No puedes importar de {platform} en Kaiord hasta que vuelvas a iniciar sesión en {platform} en este navegador.",
    }),
  });

  // Why a check asked nothing. "would-mint-token": the only request that
  // tells would issue a credential. "no-token-captured": nothing to check
  // until a tab of the Platform sends its own request. "would-download-data":
  // an extension one protocol behind checks by downloading the athlete's data.
  const NOT_CHECKED = Object.freeze({
    en: Object.freeze({
      "would-mint-token":
        "Kaiord has not checked your {platform} sign-in yet: checking it would create a new access token, so the first import or send checks it.",
      "no-token-captured":
        "Kaiord has not checked your {platform} sign-in yet: it learns it from the first request a {platform} tab sends.",
      "would-download-data":
        "Kaiord has not checked your {platform} sign-in yet: with this version of the extension, checking it would download your data, so the first import checks it.",
    }),
    es: Object.freeze({
      "would-mint-token":
        "Kaiord aún no ha comprobado tu inicio de sesión en {platform}: comprobarlo crearía un nuevo token de acceso, así que lo comprueba la primera importación o envío.",
      "no-token-captured":
        "Kaiord aún no ha comprobado tu inicio de sesión en {platform}: lo sabe con la primera petición que envía una pestaña de {platform}.",
      "would-download-data":
        "Kaiord aún no ha comprobado tu inicio de sesión en {platform}: con esta versión de la extensión, comprobarlo descargaría tus datos, así que lo comprueba la primera importación.",
    }),
  });

  const NO_TAB = Object.freeze({
    en: Object.freeze({
      message:
        "You cannot use {platform} in Kaiord until a {platform} tab is open in this browser.",
      action: "Open {platform}",
    }),
    es: Object.freeze({
      message:
        "No puedes usar {platform} en Kaiord hasta que abras una pestaña de {platform} en este navegador.",
      action: "Abrir {platform}",
    }),
  });

  const fill = (template, platform) =>
    template.split("{platform}").join(String(platform));

  const fixFor = (state) =>
    Object.prototype.hasOwnProperty.call(FIX_FOR_STATE, state)
      ? FIX_FOR_STATE[state]
      : "try-again";

  const noticeFor = (state, platform, locale) => {
    const fix = fixFor(state);
    if (fix === null) return null;
    const words = (WORDING[locale] || WORDING.en)[fix];
    return Object.freeze({
      fix,
      message: fill(words.message, platform),
      action: fill(words.action, platform),
    });
  };

  const wordsIn = (table, locale) => table[locale] || table.en;

  // The notice of a REASONS entry: its own message, its fix's action.
  const noticeForReason = (reason, platform, locale) => {
    if (!Object.prototype.hasOwnProperty.call(REASONS, reason)) return null;
    const fix = REASONS[reason];
    return Object.freeze({
      fix,
      reason,
      message: fill(wordsIn(REASON_WORDING, locale)[reason], platform),
      action: fill(wordsIn(WORDING, locale)[fix].action, platform),
    });
  };

  const notCheckedFor = (reason, platform, locale) => {
    const words = wordsIn(NOT_CHECKED, locale)[reason];
    return typeof words === "string" ? fill(words, platform) : null;
  };

  const noTabNotice = (platform, locale) => {
    const words = wordsIn(NO_TAB, locale);
    return Object.freeze({
      fix: "open-platform",
      message: fill(words.message, platform),
      action: fill(words.action, platform),
    });
  };

  return Object.freeze({
    FIXES,
    FIX_FOR_STATE,
    WORDING,
    REASONS,
    REASON_WORDING,
    NOT_CHECKED,
    NO_TAB,
    fixFor,
    noticeFor,
    noticeForReason,
    notCheckedFor,
    noTabNotice,
  });
})();

if (typeof module !== "undefined") {
  module.exports = KAIORD_CONNECTION_NOTICES;
}
