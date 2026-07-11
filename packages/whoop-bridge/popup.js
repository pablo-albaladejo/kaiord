/**
 * Kaiord WHOOP Bridge — Popup
 *
 * BYOK credential entry + OAuth connect + honest freshness. Status reflects
 * the real auth lifecycle: no credentials → connected → needs re-auth (a
 * failed/expired refresh surfaces here, never silently). All logic talks to
 * background.js via internal runtime messages.
 *
 * Shared helpers (msg/applySubs/$/setStatus/relativeAgo) load first from the
 * vendored bridge-popup-utils.js (see popup.html script order).
 */

// English fallback table consumed by the vendored msg() helper.
globalThis.KAIORD_POPUP_MESSAGES = {
  checking: "Checking…",
  checkingAria: "Checking",
  addCredentials: "Add WHOOP credentials to connect",
  reconnectNeeded: "Reconnect needed",
  connectedToWhoop: "Connected to WHOOP",
  notConnected: "Not connected",
  openingWhoop: "Opening WHOOP…",
  connectionFailed: "Connection failed",
  couldNotSave: "Could not save credentials",
  reconnectNeededError: "Reconnect needed — $1",
  reconnectToImport: "Reconnect needed to keep importing.",
  lastImport: "Last import · $1",
  reconnect: "Reconnect",
  connectWhoop: "Connect WHOOP",
  disconnect: "Disconnect",
  justNow: "just now",
  minuteAgo: "$1 minute ago",
  minutesAgo: "$1 minutes ago",
  hourAgo: "$1 hour ago",
  hoursAgo: "$1 hours ago",
  dayAgo: "$1 day ago",
  daysAgo: "$1 days ago",
  clientId: "Client ID",
  clientSecret: "Client secret",
  saveCredentials: "Save credentials",
  credsHint:
    "Register your own WHOOP app at developer.whoop.com and paste its credentials. They stay in this extension and never reach the web page.",
};

const sendMessage = (message) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (res) =>
      resolve(res ?? { ok: false, error: "No response" })
    );
  });

const formatRelativeIso = (iso) =>
  relativeAgo(new Date(iso).getTime()) ?? msg("justNow");

const renderSync = (state) => {
  const region = $("sync-region");
  region.innerHTML = "";
  if (state.needsReauth) {
    region.textContent = state.lastError
      ? msg("reconnectNeededError", [state.lastError])
      : msg("reconnectToImport");
    return;
  }
  if (state.lastSyncAt) {
    region.textContent = msg("lastImport", [
      formatRelativeIso(state.lastSyncAt),
    ]);
  }
};

const renderFooter = (state) => {
  const region = $("footer-region");
  region.innerHTML = "";
  const primary = document.createElement("button");
  primary.type = "button";
  primary.className = "cta-primary";
  primary.textContent = state.authenticated
    ? msg("reconnect")
    : msg("connectWhoop");
  primary.disabled = !state.hasCredentials;
  primary.addEventListener("click", () => runConnect());
  region.appendChild(primary);

  if (state.authenticated || state.needsReauth) {
    const secondary = document.createElement("button");
    secondary.type = "button";
    secondary.className = "cta-secondary";
    secondary.textContent = msg("disconnect");
    secondary.addEventListener("click", () => runDisconnect());
    region.appendChild(secondary);
  }
};

const applyState = (state) => {
  if (!state.hasCredentials) {
    setStatus("no", "✗", msg("addCredentials"));
  } else if (state.needsReauth) {
    setStatus("warn", "!", msg("reconnectNeeded"));
  } else if (state.authenticated) {
    setStatus("ok", "✓", msg("connectedToWhoop"));
  } else {
    setStatus("no", "✗", msg("notConnected"));
  }
  $("creds-region").hidden = state.hasCredentials && state.authenticated;
  renderSync(state);
  renderFooter(state);
};

const refresh = async () => {
  const res = await sendMessage({ action: "status" });
  applyState(res.ok ? res.data : { hasCredentials: false });
};

const runConnect = async () => {
  setStatus("checking", "…", msg("openingWhoop"));
  const res = await sendMessage({ action: "connect" });
  if (!res.ok) setStatus("no", "✗", res.error || msg("connectionFailed"));
  await refresh();
};

const runDisconnect = async () => {
  await sendMessage({ action: "disconnect" });
  await refresh();
};

const runSaveCreds = async () => {
  const clientId = $("client-id").value.trim();
  const clientSecret = $("client-secret").value.trim();
  const res = await sendMessage({
    action: "set-credentials",
    clientId,
    clientSecret,
  });
  if (!res.ok) {
    setStatus("no", "✗", res.error || msg("couldNotSave"));
    return;
  }
  $("client-secret").value = "";
  await refresh();
};

// Chrome does not expand __MSG__ tokens in popup HTML, so the static
// credential-form strings are localized here on load.
const localizeStatic = () => {
  $("status").setAttribute("aria-label", msg("checkingAria"));
  $("status-text").textContent = msg("checking");
  document.querySelector('label[for="client-id"]').textContent =
    msg("clientId");
  document.querySelector('label[for="client-secret"]').textContent =
    msg("clientSecret");
  $("save-creds").textContent = msg("saveCredentials");
  document.querySelector(".creds__hint").textContent = msg("credsHint");
};

$("save-creds").addEventListener("click", () => runSaveCreds());
window.addEventListener("DOMContentLoaded", () => {
  localizeStatic();
  refresh();
});
