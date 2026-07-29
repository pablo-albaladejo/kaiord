import { describe, it, expect, beforeEach } from "vitest";

const tpAuth = require("../tp-auth.js");

const HTTP_OK = 200;
const ONE_HOUR_SECONDS = 3600;
const ATHLETE_ID = 900123;

// Cookie-only token-exchange Response double, as cookieSessionFetch reads it
// (.type/.redirected/.status/.ok/.headers.get/.text()).
const tokenResponse = (payload) => ({
  ok: true,
  status: HTTP_OK,
  type: "basic",
  redirected: false,
  headers: { get: () => "application/json" },
  text: () => Promise.resolve(JSON.stringify(payload)),
});

const TOKEN_PAYLOAD = {
  token: { access_token: "AT-1", expires_in: ONE_HOUR_SECONDS },
  athleteId: ATHLETE_ID,
};

describe("tp-auth.js", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  // The credential-handshake surface. The TrainingPeaks session cookie is
  // sent to this endpoint in exchange for a Bearer, and `exchangeToken`
  // calls cookieSessionFetch directly — it never consults background.js's
  // `isAllowed`. scripts/check-bridge-privacy-surface.mjs records the
  // declaration into the golden fixture.
  //
  // The path also sits in background.js's ALLOWED, but only so the editor's
  // own session probe can reach it. That is a coincidence: delete that
  // allowlist entry and the endpoint leaves the golden while the cookie
  // keeps travelling to it. Which is why it is declared here, next to the
  // call, rather than inferred from the allowlist.
  describe("AUTH_ENDPOINTS", () => {
    it("pins the exact handshake surface", () => {
      expect(tpAuth.AUTH_ENDPOINTS).toEqual([
        "https://tpapi.trainingpeaks.com/users/v3/token",
      ]);
    });

    it("matches every URL the token exchange actually requests", async () => {
      // The other half of the ratchet. The guard can only see that the
      // declaration has not moved; this sees that it still describes the
      // call. Dropping the entry and regenerating the golden would
      // otherwise be a green way to un-record a live credential sink.
      fetch.mockResolvedValueOnce(tokenResponse(TOKEN_PAYLOAD));

      await tpAuth.exchangeToken(fetch);

      const requested = fetch.mock.calls.map((call) => {
        const u = new URL(call[0]);
        return u.origin + u.pathname;
      });
      expect(requested.length).toBe(1);
      expect([...new Set(requested)].sort()).toEqual(
        [...tpAuth.AUTH_ENDPOINTS].sort()
      );
    });

    it("sends the cookie, and no Authorization header, to that endpoint", () => {
      // Why this endpoint is privacy-relevant at all: it is the one request
      // the bridge makes with `credentials:"include"` and no bearer, i.e.
      // the one carrying the user's own session.
      fetch.mockResolvedValueOnce(tokenResponse(TOKEN_PAYLOAD));

      return tpAuth.exchangeToken(fetch).then(() => {
        const [url, init] = fetch.mock.calls[0];
        expect(url).toBe(tpAuth.AUTH_ENDPOINTS[0]);
        expect(init.credentials).toBe("include");
        expect(init.headers.Authorization).toBeUndefined();
      });
    });
  });
});
