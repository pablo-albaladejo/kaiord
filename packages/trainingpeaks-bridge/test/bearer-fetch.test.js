/**
 * Kaiord Bridge Core — Bearer Fetch transport unit tests (vendored)
 *
 * Master: packages/_shared/bridge-core/test/bearer-fetch.test.js.
 * Never edit a vendored copy — edit the master and run `pnpm bridge:sync`.
 */
import { describe, it, expect, vi } from "vitest";

const { bearerFetch, bearerRequest } = require("../bearer-fetch.js");

const BASE_URL = "https://api.example.test";
const OK_STATUS = 200;
const NO_CONTENT_STATUS = 204;
const UNAUTHORIZED_STATUS = 401;
const FORBIDDEN_STATUS = 403;

const jsonResp = (obj, ok = true, status = OK_STATUS) => ({
  ok,
  status,
  json: () => Promise.resolve(obj),
  text: () => Promise.resolve(JSON.stringify(obj)),
});
const textResp = (body, ok = true, status = OK_STATUS) => ({
  ok,
  status,
  text: () => Promise.resolve(body),
});

describe("bridge-core bearer-fetch (vendored)", () => {
  describe("bearerFetch", () => {
    it("should send a JSON body with a Bearer header and no cookies", async () => {
      // Arrange
      const fetchImpl = vi.fn().mockResolvedValue(jsonResp({ id: 1 }));

      // Act
      const res = await bearerFetch({
        baseUrl: BASE_URL,
        path: "/resource",
        method: "POST",
        body: { name: "x" },
        accessToken: "bear",
        fetchImpl,
      });

      // Assert
      expect(res).toEqual({ ok: true, status: OK_STATUS, data: { id: 1 } });
      const [url, init] = fetchImpl.mock.calls[0];
      expect(url).toBe("https://api.example.test/resource");
      expect(init.method).toBe("POST");
      expect(init.headers.Authorization).toBe("Bearer bear");
      expect(init.credentials).toBe("omit");
      expect(init.headers["Content-Type"]).toBe("application/json");
      expect(init.body).toBe(JSON.stringify({ name: "x" }));
    });

    it("should send a multipart FormData body without a JSON content-type", async () => {
      // Arrange
      const fetchImpl = vi.fn().mockResolvedValue(jsonResp({ uploaded: true }));
      const form = new FormData();
      form.append("file", new Blob([new Uint8Array([1, 2, 3])]), "data.fit");

      // Act
      const res = await bearerFetch({
        baseUrl: BASE_URL,
        path: "/upload",
        method: "POST",
        body: form,
        accessToken: "bear",
        fetchImpl,
      });

      // Assert
      expect(res.ok).toBe(true);
      const init = fetchImpl.mock.calls[0][1];
      expect(init.body).toBeInstanceOf(FormData);
      expect(init.headers["Content-Type"]).toBeUndefined();
      expect(init.headers.Authorization).toBe("Bearer bear");
      expect(init.credentials).toBe("omit");
    });

    it("should map a 204 No Content response to a null data envelope", async () => {
      // Arrange
      const fetchImpl = vi
        .fn()
        .mockResolvedValue({ ok: true, status: NO_CONTENT_STATUS });

      // Act
      const res = await bearerFetch({
        baseUrl: BASE_URL,
        path: "/resource",
        method: "POST",
        body: { a: 1 },
        accessToken: "bear",
        fetchImpl,
      });

      // Assert
      expect(res).toEqual({ ok: true, status: NO_CONTENT_STATUS, data: null });
    });

    it("should return a failure envelope with the truncated body on a non-2xx", async () => {
      // Arrange
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(textResp("Forbidden", false, FORBIDDEN_STATUS));

      // Act
      const res = await bearerFetch({
        baseUrl: BASE_URL,
        path: "/resource",
        method: "GET",
        accessToken: "bear",
        fetchImpl,
      });

      // Assert
      expect(res).toEqual({
        ok: false,
        status: FORBIDDEN_STATUS,
        body: "Forbidden",
      });
    });
  });

  describe("bearerRequest", () => {
    it("should call getToken once and return the envelope on the happy path", async () => {
      // Arrange
      const fetchImpl = vi.fn().mockResolvedValue(jsonResp([{ id: 7 }]));
      const getToken = vi.fn().mockResolvedValue("fresh");
      const refreshToken = vi.fn();

      // Act
      const res = await bearerRequest({
        baseUrl: BASE_URL,
        path: "/resource",
        method: "GET",
        getToken,
        refreshToken,
        fetchImpl,
      });

      // Assert
      expect(res).toEqual({ ok: true, status: OK_STATUS, data: [{ id: 7 }] });
      expect(getToken).toHaveBeenCalledTimes(1);
      expect(refreshToken).not.toHaveBeenCalled();
      expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe(
        "Bearer fresh"
      );
    });

    it("should re-mint and retry once when the first Bearer call is a 401", async () => {
      // Arrange
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(textResp("nope", false, UNAUTHORIZED_STATUS))
        .mockResolvedValueOnce(jsonResp([{ id: 8 }]));
      const getToken = vi.fn().mockResolvedValue("stale");
      const refreshToken = vi.fn().mockResolvedValue("reminted");

      // Act
      const res = await bearerRequest({
        baseUrl: BASE_URL,
        path: "/resource",
        method: "GET",
        getToken,
        refreshToken,
        fetchImpl,
      });

      // Assert
      expect(res).toEqual({ ok: true, status: OK_STATUS, data: [{ id: 8 }] });
      expect(refreshToken).toHaveBeenCalledTimes(1);
      expect(fetchImpl.mock.calls[1][1].headers.Authorization).toBe(
        "Bearer reminted"
      );
    });

    it("should flag needsReauth when the retry is also a 401", async () => {
      // Arrange
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(textResp("nope", false, UNAUTHORIZED_STATUS));
      const getToken = vi.fn().mockResolvedValue("stale");
      const refreshToken = vi.fn().mockResolvedValue("reminted");

      // Act
      const res = await bearerRequest({
        baseUrl: BASE_URL,
        path: "/resource",
        method: "GET",
        getToken,
        refreshToken,
        fetchImpl,
      });

      // Assert
      expect(res.ok).toBe(false);
      expect(res.status).toBe(UNAUTHORIZED_STATUS);
      expect(res.needsReauth).toBe(true);
    });
  });
});
