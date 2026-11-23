// Vocabulary of scripts/check-connection-notices.mjs.
//
// FIXES is the closed set (GLOSSARY.md, "What the athlete reads"). PATTERNS
// recognise a sentence that words one of those fixes, or a fifth one, in
// English or Spanish; any such sentence outside the single source
// (packages/_shared/bridge-core/connection-notices.js) is a second wording.
// ALLOWED lists the exact phrases that match a pattern without being a
// Connection notice, each with its reason. Adding a phrase here is a decision:
// name why the athlete does not read it as a fix for a Connection.

export const FIXES = ["install", "update", "sign-in", "try-again"];

export const LOCALES = ["en", "es"];

// Beside the four fixes the single source holds only these tables. REASONS
// map a Connection that looks signed in but cannot serve to one of the four
// fixes; NOT_CHECKED words why a check asked nothing (no notice). NO_TAB is
// the one exception to the four fixes: WHOOP (unpublished, experimental)
// holds a working sign-in but reads only through an open WHOOP tab, so its
// fix is "Open {platform}"; the popup and the App show it at the same moment
// (the check's `tabOpen`). A second exception fails the guard.
export const EXCEPTION = "NO_TAB";
export const SOURCE_TABLES = [
  "FIXES",
  "FIX_FOR_STATE",
  "WORDING",
  "REASONS",
  "REASON_WORDING",
  "NOT_CHECKED",
  EXCEPTION,
];

export const PATTERNS = [
  { fix: "install", pattern: /\binstall\w*\b[^.]*\b(extension|kaiord for)\b/i },
  {
    fix: "install",
    pattern: /\b(extension|kaiord for \w+)\b[^.]*\bnot installed\b/i,
  },
  { fix: "install", pattern: /\brequires the kaiord extension\b/i },
  {
    fix: "install",
    pattern: /\binstal(a|ar|es|e|en)\b[^.]*\b(extensi[oó]n|kaiord for)\b/i,
  },
  { fix: "update", pattern: /\bupdate\w*\b[^.]*\b(extension|kaiord for)\b/i },
  {
    fix: "update",
    pattern: /\b(extension|kaiord for \w+)\b[^.]*\bout of date\b/i,
  },
  {
    fix: "update",
    pattern: /\bactualiz\w*\b[^.]*\b(extensi[oó]n|kaiord for)\b/i,
  },
  {
    fix: "update",
    pattern: /\b(extensi[oó]n|kaiord for \w+)\b[^.]*\bdesactualizad[ao]\b/i,
  },
  { fix: "sign-in", pattern: /\bsign(s|ed|ing)? (in|out)\b/i },
  { fix: "sign-in", pattern: /\blog(s|ged|ging)? (in|out)\b/i },
  { fix: "sign-in", pattern: /\bsession (expired|ended|signed out)\b/i },
  { fix: "sign-in", pattern: /\breconnect\b/i },
  { fix: "sign-in", pattern: /\binici\w* (la )?sesi[oó]n\b/i },
  {
    fix: "sign-in",
    pattern: /\bsesi[oó]n (caducada|expirada|cerrada|ha caducado)\b/i,
  },
  { fix: "sign-in", pattern: /\bcerr\w* (la )?sesi[oó]n\b/i },
  { fix: "sign-in", pattern: /\breconect\w*\b/i },
  { fix: "try-again", pattern: /\bnot (answering|responding)\b/i },
  { fix: "try-again", pattern: /\bdid not (answer|respond)\b/i },
  { fix: "try-again", pattern: /\b(timed|times) out\b/i },
  { fix: "try-again", pattern: /\bno (responde|contesta|ha respondido)\b/i },
  {
    fix: "a fifth fix",
    pattern: /\b(reload|refresh) (the|this) (page|tab)\b/i,
  },
  {
    fix: "a fifth fix",
    pattern: /\bopen (https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|eu)\b/i,
  },
  { fix: "a fifth fix", pattern: /\brestart (the|your) browser\b/i },
  {
    fix: "a fifth fix",
    pattern: /\b(recarga|reinicia) (la p[aá]gina|el navegador)\b/i,
  },
];

// `where` is the file (or file#key) the phrase may appear in; `phrase` is
// the exact text. Both must match, so a phrase allowed in one place is not
// allowed in another.
export const ALLOWED = [
  {
    where:
      "packages/workout-spa-editor/src/i18n/locales/en/coaching.json#aiError.ai-timeout",
    phrase: "AI request timed out",
    why: "the athlete's AI Provider, not a Connection to a Platform",
  },
  {
    where:
      "packages/workout-spa-editor/src/i18n/locales/en/connections.json#profileLink.notLinked",
    phrase:
      "{{name}} is signed in on this browser but not linked to this athlete, so nothing syncs yet.",
    why: "a working Connection whose coach link is missing; its fix is Link, not a Connection fix",
  },
  {
    where:
      "packages/workout-spa-editor/src/i18n/locales/en/connections.json#manage.reconnect",
    phrase: "Reconnect",
    why: "re-links a source the athlete disconnected in Kaiord; no Connection failed",
  },
];
