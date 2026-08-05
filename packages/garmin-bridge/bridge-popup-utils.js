/**
 * Kaiord Bridge Core — Popup Utilities (vendored)
 *
 * Master: packages/_shared/bridge-core/bridge-popup-utils.js. Never edit
 * a vendored copy — edit the master and run `pnpm bridge:sync`.
 *
 * i18n machinery over a per-bridge message table
 * (globalThis.KAIORD_POPUP_MESSAGES, assigned by each popup.js before any
 * helper runs), plus the DOM/timing/relative-time helpers every bridge
 * popup shares. Loaded from popup.html before bridge-popup-shell.js and the
 * site-specific popup.js (classic scripts share the page's global scope).
 */

const applySubs = (template, subs) => {
  if (subs == null) return template;
  const list = Array.isArray(subs) ? subs : [subs];
  return template.replace(/\$(\d)/g, (_, i) =>
    String(list[Number(i) - 1] ?? "")
  );
};

// At runtime the browser's chrome.i18n.getMessage returns the
// active-locale string from _locales/. The per-bridge table is the
// byte-identical English fallback for environments without chrome.i18n
// (vitest/jsdom). Positional $1 tokens mirror the named placeholders
// declared in _locales/*/messages.json.
const msg = (key, subs) =>
  globalThis.chrome?.i18n?.getMessage?.(key, subs) ||
  applySubs((globalThis.KAIORD_POPUP_MESSAGES ?? {})[key], subs);

const $ = (id) => document.getElementById(id);

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);

const relativeAgo = (epochMs) => {
  const sec = Math.floor((Date.now() - epochMs) / 1_000);
  if (sec < 60) return null;
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return msg(min === 1 ? "minuteAgo" : "minutesAgo", [String(min)]);
  }
  const hr = Math.floor(min / 60);
  if (hr < 24) {
    return msg(hr === 1 ? "hourAgo" : "hoursAgo", [String(hr)]);
  }
  const day = Math.floor(hr / 24);
  return msg(day === 1 ? "dayAgo" : "daysAgo", [String(day)]);
};

// The absolute date an outage started, as "23 Jul" — the form the V2 screen
// specifies. Pinned to en-GB rather than the browser locale because the
// bridges are English-only by rule (R-BridgeLocalesEnglishOnly): with an
// undefined locale a US-configured Chrome would render "Jul 23" into copy the
// rest of which is written day-first.
//
// The year is appended only when the outage did not start in the current one,
// so the common case stays short and a stale one cannot read as recent.
const formatSinceDate = (epochMs, now = Date.now()) => {
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) return null;
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
};

// Appended to the footer so the state's own CTAs stay reachable: a retry is
// an extra affordance, never a replacement for the fix-first primary link.
const renderRetry = (onClick) => {
  const region = $("footer-region");
  const btn = document.createElement("button");
  btn.id = "retry-btn";
  btn.type = "button";
  btn.className = "cta-retry";
  btn.textContent = msg("retry");
  btn.addEventListener("click", onClick);
  region.appendChild(btn);
  // Claim focus only when nothing else holds it. Rebuilding the footer detaches
  // the previous retry button, so focus falls back to <body> and lands here —
  // but a reload triggered from the header refresh must keep its own focus
  // instead of being yanked to the bottom of the popup on every cycle.
  const active = document.activeElement;
  if (!active || active === document.body) btn.focus();
};

if (typeof module !== "undefined") {
  module.exports = {
    applySubs,
    msg,
    $,
    withTimeout,
    relativeAgo,
    formatSinceDate,
    renderRetry,
  };
}
