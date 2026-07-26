/**
 * Kaiord WHOOP Bridge — Popup
 *
 * Session-piggyback status only: it reports whether a WHOOP session bearer has
 * been captured and offers a single deep link to open WHOOP. There is no
 * credential entry and no OAuth flow — the bridge rides the user's own session.
 * All logic talks to background.js via internal runtime messages.
 *
 * Shared helpers (msg/$/setStatus) load first from the vendored
 * bridge-popup-utils.js (see popup.html script order).
 */

const OPEN_WHOOP_URL = "https://app.whoop.com/";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  checking: "Checking…",
  checkingAria: "Checking",
  connectedToWhoop: "Connected to WHOOP",
  connectedHint: "Reading your WHOOP data through your open session.",
  noSession: "No WHOOP session",
  noSessionHint: "Open WHOOP and reload the tab, then reopen this popup.",
  openWhoop: "Open WHOOP",
  openWhoopAria: "Open WHOOP",
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
  link.href = OPEN_WHOOP_URL;
  link.target = "_blank";
  link.rel = "noopener";
  link.className = "cta-primary";
  link.textContent = msg("openWhoop");
  link.setAttribute("aria-label", msg("openWhoopAria"));
  region.appendChild(link);
};

const applyState = (status) => {
  const connected = !!status.connected;
  if (connected) {
    setStatus("ok", "✓", msg("connectedToWhoop"));
  } else {
    setStatus("no", "✗", msg("noSession"));
  }
  renderHint(connected);
  renderFooter();
};

const refresh = async () => {
  const res = await sendMessage({ action: "status" });
  applyState(res.ok ? res.data : { connected: false });
};

const localizeStatic = () => {
  $("status").setAttribute("aria-label", msg("checkingAria"));
  $("status-text").textContent = msg("checking");
};

window.addEventListener("DOMContentLoaded", () => {
  localizeStatic();
  refresh();
});
