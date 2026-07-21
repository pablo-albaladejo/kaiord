/**
 * Kaiord Tanita Bridge — Popup
 *
 * Session-status only: it reports whether the user's mytanita.eu session can
 * reach the CSV export and offers a single deep link to open MyTANITA. There
 * is no credential entry — the bridge rides the user's own logged-in session.
 * All logic talks to background.js via internal runtime messages.
 *
 * Shared helpers (msg/$/setStatus) load first from the vendored
 * bridge-popup-utils.js (see popup.html script order).
 */

const OPEN_TANITA_URL = "https://mytanita.eu/en/user";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  checking: "Checking…",
  checkingAria: "Checking",
  connectedToTanita: "Connected to MyTANITA",
  connectedHint: "Reading your body-composition export through your session.",
  noSession: "No MyTANITA session",
  noSessionHint: "Open MyTANITA and sign in, then reopen this popup.",
  openTanita: "Open MyTANITA",
  openTanitaAria: "Open MyTANITA",
};

const sendMessage = (message) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (res) =>
      resolve(res ?? { ok: false, error: "No response" })
    );
  });

const renderHint = (connected) => {
  $("sync-region").textContent = connected
    ? msg("connectedHint")
    : msg("noSessionHint");
};

const renderFooter = () => {
  const region = $("footer-region");
  region.innerHTML = "";
  const link = document.createElement("a");
  link.href = OPEN_TANITA_URL;
  link.target = "_blank";
  link.rel = "noopener";
  link.className = "cta-primary";
  link.textContent = msg("openTanita");
  link.setAttribute("aria-label", msg("openTanitaAria"));
  region.appendChild(link);
};

const applyState = (status) => {
  const connected = !!status.authenticated;
  if (connected) {
    setStatus("ok", "✓", msg("connectedToTanita"));
  } else {
    setStatus("no", "✗", msg("noSession"));
  }
  renderHint(connected);
  renderFooter();
};

const refresh = async () => {
  const res = await sendMessage({ action: "checkSession" });
  applyState(res.ok ? res.data : { authenticated: false });
};

const localizeStatic = () => {
  $("status").setAttribute("aria-label", msg("checkingAria"));
  $("status-text").textContent = msg("checking");
};

window.addEventListener("DOMContentLoaded", () => {
  localizeStatic();
  refresh();
});
