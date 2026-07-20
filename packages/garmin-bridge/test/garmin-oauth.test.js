import { describe, it, expect, beforeEach, afterEach } from "vitest";

const garminOAuth = require("../garmin-oauth.js");

const nowSec = () => Math.floor(Date.now() / 1000);

const textResp = (body, ok = true, status = 200) => ({
  ok,
  status,
  text: () => Promise.resolve(body),
});
const jsonResp = (obj, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(obj),
  text: () => Promise.resolve(JSON.stringify(obj)),
});

// A full session-mint fetch sequence (ticket → preauthorized → exchange).
const queueMint = (accessToken = "minted", oauth1 = "OT/OS") => {
  const [t, s] = oauth1.split("/");
  fetch
    .mockResolvedValueOnce(textResp("<html>...ticket=ST-9-ABCdef...</html>"))
    .mockResolvedValueOnce(textResp(`oauth_token=${t}&oauth_token_secret=${s}`))
    .mockResolvedValueOnce(jsonResp({ access_token: accessToken, expires_in: 3600 }));
};

describe("garmin-oauth.js", () => {
  beforeEach(() => {
    __resetChromeMock();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sign (OAuth1 HMAC-SHA1)", () => {
    // Freeze nonce + timestamp so the signature is deterministic, then assert
    // it equals the value computed independently by the `oauth-1.0a` library
    // (real cross-implementation lock, not a self-referential recompute).
    beforeEach(() => {
      vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
      vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((a) => {
        for (let i = 0; i < a.length; i += 1) a[i] = i;
        return a;
      });
    });

    const sigOf = (header) =>
      decodeURIComponent(header.match(/oauth_signature="([^"]+)"/)[1]);

    it("matches oauth-1.0a for a 2-legged preauthorized GET", async () => {
      const loginUrl = "https://mobile.integration.garmin.com/gcm/android";
      const url =
        `${garminOAuth.CONNECTAPI}/oauth-service/oauth/preauthorized` +
        `?ticket=ST-TEST-123&login-url=${encodeURIComponent(loginUrl)}` +
        `&accepts-mfa-tokens=true`;

      const header = await garminOAuth.sign("GET", url, {}, null);

      expect(header).toMatch(/^OAuth /);
      expect(header).toContain(
        `oauth_consumer_key="${garminOAuth.CONSUMER.key}"`
      );
      expect(sigOf(header)).toBe("yw3DvvYO4yfLD8fgyOxzCfBhPYo=");
    });

    it("matches oauth-1.0a for a 3-legged exchange POST", async () => {
      const url = `${garminOAuth.CONNECTAPI}/oauth-service/oauth/exchange/user/2.0`;

      const header = await garminOAuth.sign(
        "POST",
        url,
        { audience: "GARMIN_CONNECT_MOBILE_ANDROID_DI" },
        { key: "OT-abc", secret: "OS-xyz" }
      );

      expect(sigOf(header)).toBe("IvXlA2WHakdF1NwnapvW+o0jms0=");
    });
  });

  describe("getTicketFromSession", () => {
    it("extracts the ticket from the SSO signin page", async () => {
      fetch.mockResolvedValueOnce(
        textResp("<html>response_url=...?ticket=ST-42-Xyz...</html>")
      );

      const ticket = await garminOAuth.getTicketFromSession(fetch);

      expect(ticket).toBe("ST-42-Xyz");
      const [url, init] = fetch.mock.calls[0];
      expect(url).toContain("https://sso.garmin.com/sso/signin");
      expect(init.credentials).toBe("include");
    });

    it("throws needsReauth when the session yields no ticket", async () => {
      fetch.mockResolvedValueOnce(textResp("<html><form>sign in</form></html>"));

      await expect(garminOAuth.getTicketFromSession(fetch)).rejects.toMatchObject(
        { needsReauth: true, retryable: true }
      );
    });
  });

  describe("mintFromSession", () => {
    it("runs ticket → preauthorized → exchange and returns both tokens", async () => {
      queueMint("bearer-1", "OT-1/OS-1");

      const { oauth1, oauth2 } = await garminOAuth.mintFromSession(fetch);

      expect(oauth1).toEqual({ oauth_token: "OT-1", oauth_token_secret: "OS-1" });
      expect(oauth2.access_token).toBe("bearer-1");
      expect(oauth2.expires_at).toEqual(expect.any(Number));

      expect(fetch.mock.calls[1][0]).toContain(
        "/oauth-service/oauth/preauthorized"
      );
      expect(fetch.mock.calls[1][1].headers.Authorization).toMatch(/^OAuth /);
      expect(fetch.mock.calls[2][0]).toContain(
        "/oauth-service/oauth/exchange/user/2.0"
      );
      expect(fetch.mock.calls[2][1].method).toBe("POST");
      expect(fetch.mock.calls[2][1].headers.Authorization).toMatch(/^OAuth /);
    });
  });

  describe("exchange", () => {
    it("stamps expires_at from expires_in", async () => {
      vi.spyOn(Date, "now").mockReturnValue(1_000_000 * 1000);
      fetch.mockResolvedValueOnce(jsonResp({ access_token: "a", expires_in: 100 }));

      const oauth2 = await garminOAuth.exchange(
        { oauth_token: "t", oauth_token_secret: "s" },
        fetch
      );

      expect(oauth2.expires_at).toBe(1_000_000 + 100);
    });

    it("throws needsReauth on a non-2xx", async () => {
      fetch.mockResolvedValueOnce(textResp("nope", false, 401));

      await expect(
        garminOAuth.exchange({ oauth_token: "t", oauth_token_secret: "s" }, fetch)
      ).rejects.toMatchObject({ needsReauth: true });
    });
  });

  describe("token store + expiry", () => {
    it("round-trips tokens through chrome.storage.local", async () => {
      const tokens = {
        oauth1: { oauth_token: "t", oauth_token_secret: "s" },
        oauth2: { access_token: "b", expires_at: nowSec() + 10 },
      };
      await garminOAuth.saveTokens(tokens);

      expect(await garminOAuth.loadTokens()).toEqual(tokens);

      await garminOAuth.clearTokens();
      expect(await garminOAuth.loadTokens()).toEqual({
        oauth1: null,
        oauth2: null,
      });
    });

    it("treats a missing or past expires_at as expired (with skew)", () => {
      expect(garminOAuth.isOAuth2Expired(null)).toBe(true);
      expect(garminOAuth.isOAuth2Expired({ access_token: "b" })).toBe(true);
      expect(
        garminOAuth.isOAuth2Expired({ expires_at: nowSec() - 1 })
      ).toBe(true);
      expect(
        garminOAuth.isOAuth2Expired({ expires_at: nowSec() + 3600 })
      ).toBe(false);
    });
  });

  describe("ensureToken", () => {
    it("returns stored tokens without any network call when valid", async () => {
      await garminOAuth.saveTokens({
        oauth1: { oauth_token: "t", oauth_token_secret: "s" },
        oauth2: { access_token: "b", expires_at: nowSec() + 3600 },
      });

      const tokens = await garminOAuth.ensureToken(fetch);

      expect(tokens.oauth2.access_token).toBe("b");
      expect(fetch).not.toHaveBeenCalled();
    });

    it("mints and persists when there are no stored tokens", async () => {
      queueMint("first-bearer", "OTa/OSa");

      const tokens = await garminOAuth.ensureToken(fetch);

      expect(tokens.oauth2.access_token).toBe("first-bearer");
      expect((await garminOAuth.loadTokens()).oauth1).toEqual({
        oauth_token: "OTa",
        oauth_token_secret: "OSa",
      });
    });

    it("refreshes an expired OAuth2 via exchange and persists it", async () => {
      await garminOAuth.saveTokens({
        oauth1: { oauth_token: "t", oauth_token_secret: "s" },
        oauth2: { access_token: "old", expires_at: nowSec() - 10 },
      });
      fetch.mockResolvedValueOnce(
        jsonResp({ access_token: "refreshed", expires_in: 3600 })
      );

      const tokens = await garminOAuth.ensureToken(fetch);

      expect(tokens.oauth2.access_token).toBe("refreshed");
      expect((await garminOAuth.loadTokens()).oauth2.access_token).toBe(
        "refreshed"
      );
      expect(fetch).toHaveBeenCalledTimes(1); // exchange only, no re-mint
    });

    it("re-mints from session when the refresh fails (OAuth1 dead)", async () => {
      await garminOAuth.saveTokens({
        oauth1: { oauth_token: "t", oauth_token_secret: "s" },
        oauth2: { access_token: "old", expires_at: nowSec() - 10 },
      });
      fetch.mockResolvedValueOnce(textResp("expired", false, 401)); // refresh fails
      queueMint("re-minted", "OT2/OS2"); // then full session mint

      const tokens = await garminOAuth.ensureToken(fetch);

      expect(tokens.oauth2.access_token).toBe("re-minted");
      expect(tokens.oauth1).toEqual({
        oauth_token: "OT2",
        oauth_token_secret: "OS2",
      });
    });
  });

  describe("connectapiFetch", () => {
    it("calls connectapi with a Bearer header and no cookies", async () => {
      await garminOAuth.saveTokens({
        oauth1: { oauth_token: "t", oauth_token_secret: "s" },
        oauth2: { access_token: "bear", expires_at: nowSec() + 3600 },
      });
      fetch.mockResolvedValueOnce(jsonResp([{ workoutId: 1 }]));

      const res = await garminOAuth.connectapiFetch(
        "/workout-service/workouts?start=0&limit=1",
        "GET",
        undefined,
        fetch
      );

      expect(res).toEqual({ ok: true, status: 200, data: [{ workoutId: 1 }] });
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe(
        "https://connectapi.garmin.com/workout-service/workouts?start=0&limit=1"
      );
      expect(init.headers.Authorization).toBe("Bearer bear");
      expect(init.credentials).toBe("omit");
    });

    it("JSON-encodes a POST body and sets Content-Type", async () => {
      await garminOAuth.saveTokens({
        oauth1: { oauth_token: "t", oauth_token_secret: "s" },
        oauth2: { access_token: "bear", expires_at: nowSec() + 3600 },
      });
      fetch.mockResolvedValueOnce(jsonResp({ workoutId: 42 }));

      const res = await garminOAuth.connectapiFetch(
        "/workout-service/workout",
        "POST",
        { workoutName: "x" },
        fetch
      );

      expect(res.data).toEqual({ workoutId: 42 });
      const init = fetch.mock.calls[0][1];
      expect(init.method).toBe("POST");
      expect(init.body).toBe(JSON.stringify({ workoutName: "x" }));
      expect(init.headers["Content-Type"]).toBe("application/json");
    });

    it("re-mints and retries once on a 401", async () => {
      await garminOAuth.saveTokens({
        oauth1: { oauth_token: "t", oauth_token_secret: "s" },
        oauth2: { access_token: "stale", expires_at: nowSec() + 3600 },
      });
      fetch.mockResolvedValueOnce(textResp("unauthorized", false, 401)); // bearer 401
      queueMint("fresh", "OT3/OS3"); // re-mint
      fetch.mockResolvedValueOnce(jsonResp([{ workoutId: 2 }])); // retry bearer

      const res = await garminOAuth.connectapiFetch(
        "/workout-service/workouts",
        "GET",
        undefined,
        fetch
      );

      expect(res).toEqual({ ok: true, status: 200, data: [{ workoutId: 2 }] });
      expect(fetch.mock.calls[4][1].headers.Authorization).toBe("Bearer fresh");
    });

    it("passes non-401 failures straight through", async () => {
      await garminOAuth.saveTokens({
        oauth1: { oauth_token: "t", oauth_token_secret: "s" },
        oauth2: { access_token: "bear", expires_at: nowSec() + 3600 },
      });
      fetch.mockResolvedValueOnce(textResp("Forbidden", false, 403));

      const res = await garminOAuth.connectapiFetch(
        "/workout-service/workouts",
        "GET",
        undefined,
        fetch
      );

      expect(res).toEqual({ ok: false, status: 403, body: "Forbidden" });
      expect(fetch).toHaveBeenCalledTimes(1); // no re-mint on a 403
    });

    it("maps 204 No Content to a null data envelope", async () => {
      await garminOAuth.saveTokens({
        oauth1: { oauth_token: "t", oauth_token_secret: "s" },
        oauth2: { access_token: "bear", expires_at: nowSec() + 3600 },
      });
      fetch.mockResolvedValueOnce({ ok: true, status: 204 });

      const res = await garminOAuth.connectapiFetch(
        "/workout-service/workout",
        "POST",
        { a: 1 },
        fetch
      );

      expect(res).toEqual({ ok: true, status: 204, data: null });
    });
  });
});
