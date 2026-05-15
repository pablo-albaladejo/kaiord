// Tests for scripts/cws-api/state.mjs using node:test.
//
// Phase 1 spec Acceptance #2: getItem(_, _, "PUBLISHED") and
// getItem(_, _, "DRAFT") MUST produce the same normalized shape but
// build distinct request URLs (the projection query string is the only
// difference). The test stubs `globalThis.fetch` to capture the URL
// pattern and to short-circuit OAuth.

import { strict as assert } from "node:assert";
import { generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, test } from "node:test";

import { _resetCache } from "./auth.mjs";
import { getItem } from "./state.mjs";

let originalFetch;
let capturedUrls;
let mockResponses;

function makeServiceAccount() {
  // Generate a throwaway RSA key so signJwt() does not fail. We never
  // verify the JWT — the fetch stub returns a canned token response.
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  return {
    client_email: "test@example.iam.gserviceaccount.com",
    private_key: pem,
    token_uri: "https://oauth2.googleapis.com/token",
  };
}

function stubFetch() {
  capturedUrls = [];
  mockResponses = new Map();
  globalThis.fetch = async (url, _init) => {
    capturedUrls.push(String(url));
    if (String(url).includes("oauth2.googleapis.com/token")) {
      return new Response(
        JSON.stringify({ access_token: "stub-token", expires_in: 3600 }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
    const responder = mockResponses.get("default") ?? defaultItemResponder;
    return responder(String(url));
  };
}

function defaultItemResponder(url) {
  const projection = /projection=([A-Z]+)/.exec(url)?.[1] ?? "DRAFT";
  return new Response(
    JSON.stringify({
      id: "abc",
      uploadState: projection === "PUBLISHED" ? "PUBLISHED" : "SUCCESS",
      crxVersion: projection === "PUBLISHED" ? "0.2.0" : "0.3.0",
      itemError: [],
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

beforeEach(() => {
  originalFetch = globalThis.fetch;
  _resetCache();
  stubFetch();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  _resetCache();
});

test("getItem(DRAFT) and getItem(PUBLISHED) build distinct URLs", async () => {
  const sa = makeServiceAccount();
  await getItem(sa, "abc", "DRAFT");
  await getItem(sa, "abc", "PUBLISHED");
  const apiUrls = capturedUrls.filter((u) =>
    u.includes("chromewebstore/v1.1/items/")
  );
  assert.equal(apiUrls.length, 2);
  assert.match(apiUrls[0], /projection=DRAFT/);
  assert.match(apiUrls[1], /projection=PUBLISHED/);
});

test("getItem returns the same normalized shape for both projections", async () => {
  const sa = makeServiceAccount();
  const draft = await getItem(sa, "abc", "DRAFT");
  const published = await getItem(sa, "abc", "PUBLISHED");
  const expectedKeys = [
    "id",
    "uploadState",
    "crxVersion",
    "publicKey",
    "itemError",
    "rawResponse",
  ].sort();
  assert.deepEqual(Object.keys(draft).sort(), expectedKeys);
  assert.deepEqual(Object.keys(published).sort(), expectedKeys);
  // Values differ per projection (which is the whole point), but the
  // structural contract is identical.
  assert.equal(typeof draft.uploadState, "string");
  assert.equal(typeof published.uploadState, "string");
  assert.ok(Array.isArray(draft.itemError));
  assert.ok(Array.isArray(published.itemError));
});

test("getItem defaults to projection=DRAFT when not specified", async () => {
  const sa = makeServiceAccount();
  await getItem(sa, "abc");
  const apiUrl = capturedUrls.find((u) =>
    u.includes("chromewebstore/v1.1/items/")
  );
  assert.match(apiUrl, /projection=DRAFT/);
});

test("getItem URL-encodes the extension id", async () => {
  const sa = makeServiceAccount();
  await getItem(sa, "weird/id with spaces", "PUBLISHED");
  const apiUrl = capturedUrls.find((u) =>
    u.includes("chromewebstore/v1.1/items/")
  );
  assert.match(apiUrl, /weird%2Fid%20with%20spaces/);
});

test("should redact Bearer tokens leaked back in getItem error body", async () => {
  // Arrange
  const sa = makeServiceAccount();
  mockResponses.set("default", () =>
    new Response("rejected: Bearer ya29.aaaaaaaaaaaaaaaaaaaa", { status: 400 })
  );

  // Act
  let caught;
  try {
    await getItem(sa, "abc", "DRAFT");
  } catch (e) {
    caught = e;
  }

  // Assert
  assert.ok(caught instanceof (await import("./errors.mjs")).CwsStateError);
  assert.match(caught.message, /\[redacted\]/);
  assert.ok(!caught.message.includes("ya29.aaaaaaaaaaaaaaaaaaaa"));
});
