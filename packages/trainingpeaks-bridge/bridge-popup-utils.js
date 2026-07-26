/**
 * Kaiord Bridge Core — Popup Utilities (vendored)
 *
 * Master: packages/_shared/bridge-core/bridge-popup-utils.js. Never edit
 * a vendored copy — edit the master and run `pnpm bridge:sync`.
 *
 * i18n machinery over a per-bridge message table
 * (globalThis.KAIORD_POPUP_MESSAGES, assigned by each popup.js before any
 * helper runs), plus the DOM/status/timing/relative-time helpers every
 * bridge popup shares. Loaded from popup.html before the site-specific
 * popup.js (classic scripts share the page's global scope).
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

const setStatus = (kind, glyph, text, { sub, ariaLabel } = {}) => {
  const el = $("status");
  el.className = `status status--${kind}`;
  el.setAttribute("aria-label", ariaLabel ?? text);
  el.querySelector(".status__glyph").textContent = glyph;
  $("status-text").textContent = text;
  const subEl = $("status-sub");
  if (!subEl) return;
  if (sub) {
    subEl.textContent = sub;
    subEl.hidden = false;
  } else {
    subEl.textContent = "";
    subEl.hidden = true;
  }
};

const renderRetry = (onClick) => {
  const region = $("footer-region");
  region.innerHTML = "";
  const btn = document.createElement("button");
  btn.id = "retry-btn";
  btn.type = "button";
  btn.className = "cta-retry";
  btn.textContent = msg("retry");
  btn.addEventListener("click", onClick);
  region.appendChild(btn);
  btn.focus();
};

if (typeof module !== "undefined") {
  module.exports = {
    applySubs,
    msg,
    $,
    withTimeout,
    relativeAgo,
    setStatus,
    renderRetry,
  };
}
