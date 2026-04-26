// Service-account JWT auth flow.
//
// Flow: parse JSON key → normalize PEM → sign RS256 JWT → exchange at
// Google token endpoint → cache 1-hour access token (with 5-min safety
// margin so we never use a token within 5 min of its expiry).
//
// PEM normalization (task 2.7): the `private_key` field in the
// service-account JSON contains literal `\n` escape sequences when
// pasted as a single-line GitHub Secret. We replace them with real
// newlines before passing to crypto.createSign. Idempotent — calling
// it twice on the same input produces the same output.

import { createSign } from "node:crypto";
import { CwsAuthError } from "./errors.mjs";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/chromewebstore";
const GRANT_TYPE = "urn:ietf:params:oauth:grant-type:jwt-bearer";

let cached = null; // { token, expiresAt }

export function normalizePrivateKey(pem) {
  return pem.replace(/\\n/g, "\n");
}

export function parseServiceAccountJson(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CwsAuthError("CWS_SERVICE_ACCOUNT_KEY is not valid JSON");
  }
  const required = ["client_email", "private_key", "token_uri"];
  for (const k of required) {
    if (typeof parsed[k] !== "string" || parsed[k].length === 0) {
      throw new CwsAuthError(`service-account JSON missing field: ${k}`);
    }
  }
  return { ...parsed, private_key: normalizePrivateKey(parsed.private_key) };
}

function base64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

export function signJwt(serviceAccount, now = Date.now()) {
  const iat = Math.floor(now / 1000) - 60;
  const exp = iat + 3660;
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat,
    exp,
  };
  const signingInput =
    base64url(JSON.stringify(header)) +
    "." +
    base64url(JSON.stringify(payload));
  let signature;
  try {
    const signer = createSign("RSA-SHA256");
    signer.update(signingInput);
    signature = signer.sign(serviceAccount.private_key);
  } catch (err) {
    throw new CwsAuthError(`JWT signing failed: ${err.code ?? "ERR"}`);
  }
  return signingInput + "." + base64url(signature);
}

export async function mintAccessToken(serviceAccount, now = Date.now()) {
  if (cached && cached.expiresAt > now) return cached.token;
  const jwt = signJwt(serviceAccount, now);
  const body = new URLSearchParams({ grant_type: GRANT_TYPE, assertion: jwt });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (res.status === 401 || res.status === 403) {
    throw new CwsAuthError(`token endpoint returned ${res.status}`);
  }
  if (!res.ok) {
    throw new CwsAuthError(`token endpoint returned ${res.status}`);
  }
  const data = await res.json().catch(() => null);
  if (!data || typeof data.access_token !== "string") {
    throw new CwsAuthError("token endpoint response missing access_token");
  }
  // 1h expiry minus 5 min safety margin
  cached = { token: data.access_token, expiresAt: now + 55 * 60 * 1000 };
  return cached.token;
}

export function _resetCache() {
  cached = null;
}
