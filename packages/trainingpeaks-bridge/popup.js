/**
 * Kaiord TrainingPeaks Bridge — Popup
 *
 * Session-status only: it reports whether the user's TrainingPeaks session can
 * mint an access token and offers a single deep link to open TrainingPeaks.
 * There is no credential entry — the bridge rides the user's own logged-in
 * session cookie. All logic talks to background.js via internal runtime
 * messages.
 *
 * Shared helpers (msg/$/setStatus) load first from the vendored
 * bridge-popup-utils.js (see popup.html script order).
 */

const OPEN_TRAININGPEAKS_URL = "https://app.trainingpeaks.com/";

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  checking: "Checking…",
  checkingAria: "Checking",
  connectedToTrainingPeaks: "Connected to TrainingPeaks",
  connectedHint: "Reading your body metrics through your session.",
  noSession: "No TrainingPeaks session",
  noSessionHint: "Open TrainingPeaks and sign in, then reopen this popup.",
  openTrainingPeaks: "Open TrainingPeaks",
  openTrainingPeaksAria: "Open TrainingPeaks",
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
  link.href = OPEN_TRAININGPEAKS_URL;
  link.target = "_blank";
  link.rel = "noopener";
  link.className = "cta-primary";
  link.textContent = msg("openTrainingPeaks");
  link.setAttribute("aria-label", msg("openTrainingPeaksAria"));
  region.appendChild(link);
};

const applyState = (status) => {
  const connected = !!status.authenticated;
  if (connected) {
    setStatus("ok", "✓", msg("connectedToTrainingPeaks"));
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
