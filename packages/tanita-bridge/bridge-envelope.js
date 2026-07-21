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
 * External dispatch pins every sender against the allowed SPA origins and
 * rejects actions outside the bridge's external-actions allowlist before
 * the action handler runs (spec: bridge-core).
 */

const ALLOWED_ORIGIN_REGEX =
  /^(https:\/\/[a-z0-9-]+\.kaiord\.com|http:\/\/localhost:(5173|5174))$/;

const isAllowedSenderOrigin = (sender) =>
  typeof sender?.origin === "string" &&
  ALLOWED_ORIGIN_REGEX.test(sender.origin);

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
    if (
      !isAllowedSenderOrigin(sender) ||
      !externalActions.has(message?.action)
    ) {
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

if (typeof module !== "undefined") {
  module.exports = {
    ALLOWED_ORIGIN_REGEX,
    isAllowedSenderOrigin,
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
}
