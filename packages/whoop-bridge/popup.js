/**
 * Kaiord WHOOP Bridge — Popup
 *
 * BYOK credential entry + OAuth connect + honest freshness. Status reflects
 * the real auth lifecycle: no credentials → connected → needs re-auth (a
 * failed/expired refresh surfaces here, never silently). All logic talks to
 * background.js via internal runtime messages.
 */

const $ = (id) => document.getElementById(id);

const sendMessage = (message) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (res) =>
      resolve(res ?? { ok: false, error: "No response" })
    );
  });

const setStatus = (kind, glyph, text) => {
  const el = $("status");
  el.className = `status status--${kind}`;
  el.setAttribute("aria-label", text);
  el.querySelector(".status__glyph").textContent = glyph;
  $("status-text").textContent = text;
};

const formatRelative = (iso) => {
  const ageMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ageMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
};

const renderSync = (state) => {
  const region = $("sync-region");
  region.innerHTML = "";
  if (state.needsReauth) {
    region.textContent = state.lastError
      ? `Reconnect needed — ${state.lastError}`
      : "Reconnect needed to keep importing.";
    return;
  }
  if (state.lastSyncAt) {
    region.textContent = `Last import · ${formatRelative(state.lastSyncAt)}`;
  }
};

const renderFooter = (state) => {
  const region = $("footer-region");
  region.innerHTML = "";
  const primary = document.createElement("button");
  primary.type = "button";
  primary.className = "cta-primary";
  primary.textContent = state.authenticated ? "Reconnect" : "Connect WHOOP";
  primary.disabled = !state.hasCredentials;
  primary.addEventListener("click", () => runConnect());
  region.appendChild(primary);

  if (state.authenticated || state.needsReauth) {
    const secondary = document.createElement("button");
    secondary.type = "button";
    secondary.className = "cta-secondary";
    secondary.textContent = "Disconnect";
    secondary.addEventListener("click", () => runDisconnect());
    region.appendChild(secondary);
  }
};

const applyState = (state) => {
  if (!state.hasCredentials) {
    setStatus("no", "✗", "Add WHOOP credentials to connect");
  } else if (state.needsReauth) {
    setStatus("warn", "!", "Reconnect needed");
  } else if (state.authenticated) {
    setStatus("ok", "✓", "Connected to WHOOP");
  } else {
    setStatus("no", "✗", "Not connected");
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
  setStatus("checking", "…", "Opening WHOOP…");
  const res = await sendMessage({ action: "connect" });
  if (!res.ok) setStatus("no", "✗", res.error || "Connection failed");
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
  if (!res.ok) setStatus("no", "✗", res.error || "Could not save credentials");
  $("client-secret").value = "";
  await refresh();
};

$("save-creds").addEventListener("click", () => runSaveCreds());
window.addEventListener("DOMContentLoaded", () => refresh());
