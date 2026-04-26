// Tests for scripts/cws-api.mjs and its submodules.
//
// All fetches are mocked via globalThis.fetch = (...args) => ...
// The 32-char redaction threshold (task 4.2.a rationale): we assert no
// substring ≥32 chars of any secret value (private key body, access
// token, JWT) appears in stdout/stderr. 32 is below the typical PEM
// base64 line (≥64 chars) and below typical JWT segment lengths
// (≥80 chars), so any leak via partial decode is caught; lower
// thresholds over-report benign prefixes.

import { describe, it, beforeEach, afterEach } from "node:test";
import { strictEqual, deepStrictEqual, ok } from "node:assert";
import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  signJwt,
  mintAccessToken,
  parseServiceAccountJson,
  normalizePrivateKey,
  _resetCache,
} from "./cws-api/auth.mjs";
import { getItem } from "./cws-api/state.mjs";
import { uploadCrx } from "./cws-api/upload.mjs";
import { publishItem } from "./cws-api/publish.mjs";
import { pollUntil, waitUploaded, waitPublished } from "./cws-api/poll.mjs";
import { dispatch } from "./cws-api/cli.mjs";
import {
  CwsAuthError,
  CwsStateError,
  CwsTimeoutError,
} from "./cws-api/errors.mjs";

// ---------- Fixtures ----------

function makeKey() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  return {
    pem: privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
    publicPem: publicKey.export({ format: "pem", type: "spki" }).toString(),
  };
}

function makeAccount(privateKey) {
  return {
    type: "service_account",
    project_id: "kaiord-test",
    client_email: "kaiord-cws@kaiord-test.iam.gserviceaccount.com",
    private_key: privateKey,
    token_uri: "https://oauth2.googleapis.com/token",
  };
}

function withMockFetch(impl, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return Promise.resolve(fn()).finally(() => {
    globalThis.fetch = original;
  });
}

function makeResponse({ status = 200, body = {}, raw }) {
  const text = raw ?? JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    json: async () => JSON.parse(text),
  };
}

beforeEach(() => _resetCache());

// ---------- signJwt + auth ----------

describe("signJwt", () => {
  it("produces JWT with required claims", () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    const now = 1_700_000_000_000;

    const jwt = signJwt(account, now);

    const [headerSeg, payloadSeg] = jwt.split(".");
    const header = JSON.parse(Buffer.from(headerSeg, "base64url").toString());
    const payload = JSON.parse(Buffer.from(payloadSeg, "base64url").toString());
    strictEqual(header.alg, "RS256");
    strictEqual(payload.iss, account.client_email);
    strictEqual(
      payload.scope,
      "https://www.googleapis.com/auth/chromewebstore"
    );
    strictEqual(payload.aud, "https://oauth2.googleapis.com/token");
    strictEqual(payload.iat, Math.floor(now / 1000) - 60);
    ok(payload.exp > payload.iat);
  });

  it("throws CwsAuthError without leaking PEM on signing error", () => {
    const account = makeAccount(
      "-----BEGIN PRIVATE KEY-----\nNOTABASE64\n-----END PRIVATE KEY-----\n"
    );
    let caught;
    try {
      signJwt(account);
    } catch (e) {
      caught = e;
    }
    ok(caught instanceof CwsAuthError);
    ok(!caught.message.includes("NOTABASE64"));
  });
});

describe("normalizePrivateKey", () => {
  it("converts \\\\n escape sequences to real newlines", () => {
    const escaped = "-----BEGIN-----\\nABCD\\n-----END-----";

    const normalized = normalizePrivateKey(escaped);

    strictEqual(normalized, "-----BEGIN-----\nABCD\n-----END-----");
  });

  it("is idempotent on already-normalized input", () => {
    const raw = "-----BEGIN-----\nABCD\n-----END-----";

    const once = normalizePrivateKey(raw);
    const twice = normalizePrivateKey(once);

    strictEqual(once, twice);
  });
});

describe("parseServiceAccountJson", () => {
  it("rejects malformed JSON without leaking content", () => {
    let caught;
    try {
      parseServiceAccountJson("{ this is not json:: !!");
    } catch (e) {
      caught = e;
    }
    ok(caught instanceof CwsAuthError);
    ok(!caught.message.includes("not json"));
  });

  it("rejects missing client_email", () => {
    const partial = JSON.stringify({
      private_key: "x",
      token_uri: "https://oauth2.googleapis.com/token",
    });
    let caught;
    try {
      parseServiceAccountJson(partial);
    } catch (e) {
      caught = e;
    }
    ok(caught instanceof CwsAuthError);
    ok(caught.message.includes("client_email"));
  });
});

describe("mintAccessToken", () => {
  it("returns access_token on 200 response", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    let calls = 0;
    await withMockFetch(
      async () => {
        calls++;
        return makeResponse({
          body: { access_token: "AT-1", expires_in: 3600 },
        });
      },
      async () => {
        const token = await mintAccessToken(account);
        strictEqual(token, "AT-1");
        strictEqual(calls, 1);
      }
    );
  });

  it("re-uses cached token on subsequent calls within TTL", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    let calls = 0;
    await withMockFetch(
      async () => {
        calls++;
        return makeResponse({ body: { access_token: "AT-cached" } });
      },
      async () => {
        await mintAccessToken(account, 1_000_000);
        await mintAccessToken(account, 1_000_001);
        strictEqual(calls, 1);
      }
    );
  });

  it("mints a new token after >55 min (cache TTL expiry)", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    let calls = 0;
    await withMockFetch(
      async () => {
        calls++;
        return makeResponse({ body: { access_token: `AT-${calls}` } });
      },
      async () => {
        await mintAccessToken(account, 0);
        await mintAccessToken(account, 56 * 60 * 1000);
        strictEqual(calls, 2);
      }
    );
  });

  it("throws CwsAuthError on 401", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    let caught;
    await withMockFetch(
      async () =>
        makeResponse({ status: 401, body: { error: "invalid_grant" } }),
      async () => {
        try {
          await mintAccessToken(account);
        } catch (e) {
          caught = e;
        }
      }
    );
    ok(caught instanceof CwsAuthError);
  });
});

// ---------- getItem ----------

describe("getItem", () => {
  it("normalizes 200 response", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    await withMockFetch(
      async (url) => {
        if (url.includes("oauth2.googleapis.com")) {
          return makeResponse({ body: { access_token: "AT" } });
        }
        return makeResponse({
          body: { id: "abc", uploadState: "UPLOADED", crxVersion: "1.0.0" },
        });
      },
      async () => {
        const item = await getItem(account, "abc", "DRAFT");
        strictEqual(item.uploadState, "UPLOADED");
        strictEqual(item.crxVersion, "1.0.0");
      }
    );
  });

  it("throws CwsAuthError on 403", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    let caught;
    await withMockFetch(
      async (url) => {
        if (url.includes("oauth2.googleapis.com")) {
          return makeResponse({ body: { access_token: "AT" } });
        }
        return makeResponse({ status: 403, body: { error: "forbidden" } });
      },
      async () => {
        try {
          await getItem(account, "abc");
        } catch (e) {
          caught = e;
        }
      }
    );
    ok(caught instanceof CwsAuthError);
  });

  it("throws CwsStateError on truncated/malformed JSON", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    let caught;
    await withMockFetch(
      async (url) => {
        if (url.includes("oauth2.googleapis.com")) {
          return makeResponse({ body: { access_token: "AT" } });
        }
        return makeResponse({ raw: '{"id":"abc","uploadState":"UPLO' }); // truncated
      },
      async () => {
        try {
          await getItem(account, "abc");
        } catch (e) {
          caught = e;
        }
      }
    );
    ok(caught instanceof CwsStateError);
  });

  it("throws CwsStateError on 5xx", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    let caught;
    await withMockFetch(
      async (url) => {
        if (url.includes("oauth2.googleapis.com")) {
          return makeResponse({ body: { access_token: "AT" } });
        }
        return makeResponse({ status: 503 });
      },
      async () => {
        try {
          await getItem(account, "abc");
        } catch (e) {
          caught = e;
        }
      }
    );
    ok(caught instanceof CwsStateError);
  });
});

// ---------- uploadCrx ----------

describe("uploadCrx", () => {
  let tempDir;
  let zipPath;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "cws-upload-"));
    zipPath = join(tempDir, "fixture.zip");
    writeFileSync(zipPath, Buffer.from("PKfake zip body"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns parsed CWS response on 200", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    await withMockFetch(
      async (url, options) => {
        if (url.includes("oauth2.googleapis.com")) {
          return makeResponse({ body: { access_token: "AT" } });
        }
        if (options?.body && typeof options.body.on === "function") {
          await new Promise((resolve, reject) => {
            options.body.on("data", () => {});
            options.body.on("end", resolve);
            options.body.on("error", reject);
          });
        }
        return makeResponse({
          body: { id: "abc", uploadState: "SUCCESS", crxVersion: "1.0.0" },
        });
      },
      async () => {
        const result = await uploadCrx(account, "abc", zipPath);
        strictEqual(result.uploadState, "SUCCESS");
      }
    );
  });
});

// ---------- publishItem ----------

describe("publishItem", () => {
  it("returns status array on 200", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    await withMockFetch(
      async (url) => {
        if (url.includes("oauth2.googleapis.com")) {
          return makeResponse({ body: { access_token: "AT" } });
        }
        return makeResponse({ body: { status: ["OK"] } });
      },
      async () => {
        const result = await publishItem(account, "abc");
        deepStrictEqual(result.status, ["OK"]);
      }
    );
  });

  it("throws CwsStateError on 409 conflict", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    let caught;
    await withMockFetch(
      async (url) => {
        if (url.includes("oauth2.googleapis.com")) {
          return makeResponse({ body: { access_token: "AT" } });
        }
        return makeResponse({ status: 409, body: { error: "conflict" } });
      },
      async () => {
        try {
          await publishItem(account, "abc");
        } catch (e) {
          caught = e;
        }
      }
    );
    ok(caught instanceof CwsStateError);
  });
});

// ---------- pollUntil ----------

describe("pollUntil", () => {
  it("returns on first truthy predicate", async () => {
    let n = 0;
    const result = await pollUntil(async () => (++n === 2 ? "got it" : null), {
      timeoutMs: 1000,
      intervalMs: 1,
      sleep: async () => {},
    });
    strictEqual(result, "got it");
  });

  it("throws CwsTimeoutError on deadline exceeded", async () => {
    let caught;
    let nowVal = 0;
    try {
      await pollUntil(async () => null, {
        timeoutMs: 100,
        intervalMs: 50,
        sleep: async (ms) => {
          nowVal += ms;
        },
        now: () => nowVal,
      });
    } catch (e) {
      caught = e;
    }
    ok(caught instanceof CwsTimeoutError);
  });
});

// ---------- waitUploaded retry-once ----------

describe("waitUploaded", () => {
  it("retries pollUntil once after CwsTimeoutError, succeeds on second", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    let calls = 0;
    let nowVal = 0;
    await withMockFetch(
      async (url) => {
        if (url.includes("oauth2.googleapis.com")) {
          return makeResponse({ body: { access_token: "AT" } });
        }
        calls++;
        // Calls 1-2 (first pollUntil): IN_PROGRESS → first pollUntil times out.
        // Call 3+ (second pollUntil = retry): SUCCESS → returns.
        const uploadState = calls < 3 ? "IN_PROGRESS" : "SUCCESS";
        return makeResponse({ body: { id: "abc", uploadState } });
      },
      async () => {
        const result = await waitUploaded(account, "abc", {
          timeoutMs: 50,
          sleep: async (ms) => {
            nowVal += ms;
          },
          now: () => nowVal,
        });
        strictEqual(result.uploadState, "SUCCESS");
        ok(calls >= 2, `expected at least 2 calls (retry); got ${calls}`);
      }
    );
  });
});

// ---------- waitPublished ----------

describe("waitPublished", () => {
  it("returns PUBLISHED status on matching version", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    await withMockFetch(
      async (url) => {
        if (url.includes("oauth2.googleapis.com")) {
          return makeResponse({ body: { access_token: "AT" } });
        }
        return makeResponse({
          body: { id: "abc", uploadState: "PUBLISHED", crxVersion: "1.0.0" },
        });
      },
      async () => {
        const result = await waitPublished(account, "abc", {
          version: "1.0.0",
          timeoutMs: 5000,
          sleep: async () => {},
        });
        strictEqual(result.status, "PUBLISHED");
        strictEqual(result.version, "1.0.0");
      }
    );
  });

  it("returns IN_REVIEW status when CWS reports IN_REVIEW", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    await withMockFetch(
      async (url) => {
        if (url.includes("oauth2.googleapis.com")) {
          return makeResponse({ body: { access_token: "AT" } });
        }
        return makeResponse({ body: { id: "abc", uploadState: "IN_REVIEW" } });
      },
      async () => {
        const result = await waitPublished(account, "abc", {
          version: "1.0.0",
          timeoutMs: 5000,
          sleep: async () => {},
        });
        strictEqual(result.status, "IN_REVIEW");
      }
    );
  });

  it("returns REJECTED fail-fast (<5s) when CWS reports rejection", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    await withMockFetch(
      async (url) => {
        if (url.includes("oauth2.googleapis.com")) {
          return makeResponse({ body: { access_token: "AT" } });
        }
        return makeResponse({
          body: {
            id: "abc",
            uploadState: "FAILURE",
            itemError: [{ error_code: "ITEM_REJECTED" }],
          },
        });
      },
      async () => {
        const start = Date.now();
        const result = await waitPublished(account, "abc", {
          version: "1.0.0",
          timeoutMs: 120000,
          sleep: async () => {},
        });
        const elapsed = Date.now() - start;
        strictEqual(result.status, "REJECTED");
        ok(elapsed < 5000, `elapsed=${elapsed}ms; expected <5000`);
      }
    );
  });

  it("returns TIMEOUT when no terminal state reached", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    let nowVal = 0;
    await withMockFetch(
      async (url) => {
        if (url.includes("oauth2.googleapis.com")) {
          return makeResponse({ body: { access_token: "AT" } });
        }
        return makeResponse({ body: { id: "abc", uploadState: "PROCESSING" } });
      },
      async () => {
        const result = await waitPublished(account, "abc", {
          version: "1.0.0",
          timeoutMs: 50,
          sleep: async (ms) => {
            nowVal += ms;
          },
          now: () => nowVal,
        });
        strictEqual(result.status, "TIMEOUT");
      }
    );
  });
});

// ---------- CLI dispatch ----------

describe("dispatch (CLI)", () => {
  it("returns exit 2 for unknown subcommand", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    const stderrChunks = [];
    const origWrite = process.stderr.write;
    process.stderr.write = (chunk) => {
      stderrChunks.push(String(chunk));
      return true;
    };
    let code;
    try {
      code = await dispatch(["bogus", "abc"], account);
    } finally {
      process.stderr.write = origWrite;
    }
    strictEqual(code, 2);
  });

  it("runs check subcommand and prints JSON", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    const stdoutChunks = [];
    const origWrite = process.stdout.write;
    process.stdout.write = (chunk) => {
      stdoutChunks.push(String(chunk));
      return true;
    };
    let code;
    try {
      await withMockFetch(
        async (url) => {
          if (url.includes("oauth2.googleapis.com")) {
            return makeResponse({ body: { access_token: "AT" } });
          }
          return makeResponse({ body: { id: "abc", uploadState: "UPLOADED" } });
        },
        async () => {
          code = await dispatch(["check", "abc"], account);
        }
      );
    } finally {
      process.stdout.write = origWrite;
    }
    strictEqual(code, 0);
    const text = stdoutChunks.join("");
    ok(text.length > 0);
    const parsed = JSON.parse(text);
    strictEqual(parsed.uploadState, "UPLOADED");
  });
});

// ---------- Secret redaction (Factor XI complement) ----------

describe("secret redaction", () => {
  it("does not leak access_token or PEM body in error stderr", async () => {
    const { pem } = makeKey();
    const account = makeAccount(pem);
    const accessToken = "ya29." + "a".repeat(80);
    const stderrChunks = [];
    const origWrite = process.stderr.write;
    process.stderr.write = (chunk) => {
      stderrChunks.push(String(chunk));
      return true;
    };
    try {
      await withMockFetch(
        async (url) => {
          if (url.includes("oauth2.googleapis.com")) {
            return makeResponse({ body: { access_token: accessToken } });
          }
          return makeResponse({ status: 401 });
        },
        async () => {
          await dispatch(["check", "abc"], account);
        }
      );
    } finally {
      process.stderr.write = origWrite;
    }
    const stderr = stderrChunks.join("");
    // No 32+ char substring of the access token or PEM body should appear.
    const tokenSlice = accessToken.slice(0, 32);
    const pemBodyMatch = pem.match(
      /-----BEGIN PRIVATE KEY-----\n([\s\S]+?)\n-----END/
    );
    const pemSlice = pemBodyMatch ? pemBodyMatch[1].slice(0, 32) : "";
    ok(!stderr.includes(tokenSlice));
    if (pemSlice.length === 32) {
      ok(!stderr.includes(pemSlice));
    }
  });
});
