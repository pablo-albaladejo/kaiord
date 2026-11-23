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
          "{platform} no responde, así que ahora mismo no puedes usarlo en Kaiord.",
        action: "Reintentar",
      }),
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

  return Object.freeze({
    FIXES,
    FIX_FOR_STATE,
    WORDING,
    fixFor,
    noticeFor,
  });
})();

if (typeof module !== "undefined") {
  module.exports = KAIORD_CONNECTION_NOTICES;
}
