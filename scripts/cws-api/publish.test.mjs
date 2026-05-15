// Tests for scripts/cws-api/publish.mjs using node:test.
//
// Covers: 4xx body capture, redaction, auth-branch isolation, 429 message lock.
// Fetch is stubbed via globalThis.fetch to short-circuit OAuth and CWS I/O.

import { strict as assert } from "node:assert";
import { generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, it } from "node:test";

import { _resetCache } from "./auth.mjs";
import { CwsAuthError, CwsStateError } from "./errors.mjs";
import { publishItem } from "./publish.mjs";

let originalFetch;

function makeServiceAccount() {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  return {
    client_email: "test@example.iam.gserviceaccount.com",
    private_key: pem,
    token_uri: "https://oauth2.googleapis.com/token",
  };
}

function stubFetch(statusAndBody) {
  globalThis.fetch = async (url, _init) => {
    if (String(url).includes("oauth2.googleapis.com/token")) {
      return new Response(
        JSON.stringify({ access_token: "stub-token", expires_in: 3600 }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
    return new Response(statusAndBody.raw, {
      status: statusAndBody.status,
      headers: { "content-type": "application/json" },
    });
  };
}

beforeEach(() => {
  originalFetch = globalThis.fetch;
  _resetCache();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  _resetCache();
});

describe("publishItem 4xx body capture", () => {
  it("should include CWS error message on 400 with Google standard envelope", async () => {
    // Arrange
    const sa = makeServiceAccount();
    const body = JSON.stringify({
      error: {
        code: 400,
        status: "INVALID_ARGUMENT",
        message: "Item must be in DRAFT state to publish; current state: IN_REVIEW",
        details: [],
      },
    });
    stubFetch({ status: 400, raw: body });

    // Act
    let caught;
    try {
      await publishItem(sa, "abc");
    } catch (e) {
      caught = e;
    }

    // Assert
    assert.ok(caught instanceof CwsStateError);
    assert.match(caught.message, /400/);
    assert.match(caught.message, /INVALID_ARGUMENT/);
    assert.match(caught.message, /Item must be in DRAFT state/);
  });

  it("should include CWS error message on 400 with itemError array shape", async () => {
    // Arrange
    const sa = makeServiceAccount();
    const body = JSON.stringify({
      itemError: [
        {
          error_code: "ITEM_NOT_READY_FOR_PUBLISH",
          error_detail: "Item is in review",
        },
      ],
    });
    stubFetch({ status: 400, raw: body });

    // Act
    let caught;
    try {
      await publishItem(sa, "abc");
    } catch (e) {
      caught = e;
    }

    // Assert
    assert.ok(caught instanceof CwsStateError);
    assert.match(caught.message, /400/);
    assert.match(caught.message, /ITEM_NOT_READY_FOR_PUBLISH/);
    assert.match(caught.message, /Item is in review/);
  });

  it("should fall back to raw body on 400 with non-JSON response", async () => {
    // Arrange
    const sa = makeServiceAccount();
    stubFetch({ status: 400, raw: "plain text error from CWS" });

    // Act
    let caught;
    try {
      await publishItem(sa, "abc");
    } catch (e) {
      caught = e;
    }

    // Assert
    assert.ok(caught instanceof CwsStateError);
    assert.match(caught.message, /400/);
    assert.match(caught.message, /plain text error from CWS/);
  });

  it("should slice oversized error bodies to 400 chars", async () => {
    // Arrange
    const sa = makeServiceAccount();
    stubFetch({ status: 400, raw: "X".repeat(2000) });

    // Act
    let caught;
    try {
      await publishItem(sa, "abc");
    } catch (e) {
      caught = e;
    }

    // Assert
    assert.ok(caught instanceof CwsStateError);
    // Message = "[CwsStateError] publishItem returned 400: " + up to 400 chars body
    assert.ok(caught.message.length <= 450);
  });

  it("should redact Bearer tokens leaked back in the error body", async () => {
    // Arrange
    const sa = makeServiceAccount();
    stubFetch({ status: 400, raw: "rejected: Bearer ya29.aaaaaaaaaaaaaaaaaaaa" });

    // Act
    let caught;
    try {
      await publishItem(sa, "abc");
    } catch (e) {
      caught = e;
    }

    // Assert
    assert.ok(caught instanceof CwsStateError);
    assert.match(caught.message, /400/);
    assert.match(caught.message, /\[redacted\]/);
    assert.ok(!caught.message.includes("ya29.aaaaaaaaaaaaaaaaaaaa"));
  });

  it("should redact Authorization header without double-replacing the Bearer span", async () => {
    // Arrange
    const sa = makeServiceAccount();
    stubFetch({ status: 400, raw: "Authorization: Bearer abc123" });

    // Act
    let caught;
    try {
      await publishItem(sa, "abc");
    } catch (e) {
      caught = e;
    }

    // Assert
    assert.ok(caught instanceof CwsStateError);
    assert.match(caught.message, /Authorization: \[redacted\]/);
    assert.ok(!caught.message.includes("Authorization: [redacted] [redacted]"));
  });

  it("should throw CwsAuthError on 401 without exposing response body", async () => {
    // Arrange
    const sa = makeServiceAccount();
    stubFetch({ status: 401, raw: "Bearer leaked-token-body" });

    // Act
    let caught;
    try {
      await publishItem(sa, "abc");
    } catch (e) {
      caught = e;
    }

    // Assert
    assert.ok(caught instanceof CwsAuthError);
    assert.ok(!caught.message.includes("leaked-token-body"));
  });

  it("should keep the explicit rate-limited message on 429", async () => {
    // Arrange
    const sa = makeServiceAccount();
    stubFetch({ status: 429, raw: "Quota exceeded — long detail..." });

    // Act
    let caught;
    try {
      await publishItem(sa, "abc");
    } catch (e) {
      caught = e;
    }

    // Assert
    assert.strictEqual(
      caught.message,
      "[CwsStateError] publishItem returned 429 (rate limited)"
    );
  });
});
