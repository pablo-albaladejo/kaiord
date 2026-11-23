/**
 * Kaiord Bridge Core — Response Envelope + Dispatch (vendored)
 *
 * Master: packages/_shared/bridge-core/bridge-envelope.js. Never edit a
 * vendored copy — edit the master and run `pnpm bridge:sync`
 * (parity guard: scripts/check-bridge-core-parity.test.mjs).
 *
 * Message envelope for the SPA ↔ bridge protocol:
 *   { ok, protocolVersion, data?, error?, status?, retryable?,
 *     needsReauth?, resetSeconds? }
 *
 * External dispatch answers only the exact Kaiord App origin (no
 * subdomain, www included) and rejects actions outside the bridge's
 * external-actions allowlist before the action handler runs
 * (spec: bridge-core). Internal dispatch answers only the extension's own
 * pages (the popup), never a content script, so an action reachable only
 * through the external gate stays reachable only from the App origin.
 */

const APP_ORIGIN = "https://kaiord.com";

// Accepted only when the loaded manifest declares them, so an unpacked dev
// build (manifest.json) reaches the Vite dev server and a packaged build
// (manifest.prod.json) refuses them at runtime too.
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:5174"];

const isDeclaredByManifest = (origin) => {
  const manifest = globalThis.chrome?.runtime?.getManifest?.();
  const matches = manifest?.externally_connectable?.matches;
  return Array.isArray(matches) && matches.includes(`${origin}/*`);
};

const isAllowedSenderOrigin = (sender) => {
  const origin = sender?.origin;
  if (origin === APP_ORIGIN) return true;
  return DEV_ORIGINS.includes(origin) && isDeclaredByManifest(origin);
};

const createEnvelope = (protocolVersion) => {
  const sendResult = (data, sendResponse) => {
    sendResponse({ ok: true, protocolVersion, data });
  };

  const sendError = (err, sendResponse) => {
    sendResponse({
      ok: false,
      protocolVersion,
      error: String(err?.message ?? err),
      ...(typeof err?.status === "number" ? { status: err.status } : {}),
      ...(typeof err?.retryable === "boolean"
        ? { retryable: err.retryable }
        : {}),
      ...(err?.needsReauth ? { needsReauth: true } : {}),
      ...(typeof err?.resetSeconds === "number"
        ? { resetSeconds: err.resetSeconds }
        : {}),
    });
  };

  return { sendResult, sendError };
};

const createDispatch = ({ handleAction, protocolVersion }) => {
  const { sendResult, sendError } = createEnvelope(protocolVersion);
  return (message, sendResponse) => {
    handleAction(message)
      .then((data) => sendResult(data, sendResponse))
      .catch((err) => sendError(err, sendResponse));
    return true;
  };
};

const createExternalDispatch = ({
  dispatch,
  externalActions,
  protocolVersion,
}) => {
  return (message, sender, sendResponse) => {
    // Any other origin gets no answer at all, not even an error envelope.
    if (!isAllowedSenderOrigin(sender)) return false;
    if (!externalActions.has(message?.action)) {
      sendResponse({
        ok: false,
        protocolVersion,
        error: "Origin or action not permitted",
        retryable: false,
      });
      return true;
    }
    return dispatch(message, sendResponse);
  };
};

// A content script is internal too, but it runs in a web page (`sender.tab`
// is set and `sender.origin` is the page's), so neither passes this check.
const isOwnExtensionPage = (sender) => {
  const id = globalThis.chrome?.runtime?.id;
  return (
    typeof id === "string" &&
    sender?.id === id &&
    !sender.tab &&
    sender.origin === `chrome-extension://${id}`
  );
};

const createInternalDispatch = ({
  dispatch,
  internalActions,
  protocolVersion,
}) => {
  return (message, sender, sendResponse) => {
    if (!isOwnExtensionPage(sender)) return false;
    if (!internalActions.has(message?.action)) {
      sendResponse({
        ok: false,
        protocolVersion,
        error: "Action not permitted",
        retryable: false,
      });
      return true;
    }
    return dispatch(message, sendResponse);
  };
};

if (typeof module !== "undefined") {
  module.exports = {
    isAllowedSenderOrigin,
    isOwnExtensionPage,
    createInternalDispatch,
    createEnvelope,
    createDispatch,
    createExternalDispatch,
  };
}

if (typeof self !== "undefined" && typeof module === "undefined") {
  self.isAllowedSenderOrigin = isAllowedSenderOrigin;
  self.createEnvelope = createEnvelope;
  self.createDispatch = createDispatch;
  self.createExternalDispatch = createExternalDispatch;
  self.isOwnExtensionPage = isOwnExtensionPage;
  self.createInternalDispatch = createInternalDispatch;
}
