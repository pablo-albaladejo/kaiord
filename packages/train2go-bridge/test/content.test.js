const { isAllowed, handleFetch, ALLOWED } = require("../content.js");

describe("content script", () => {
  beforeEach(() => __resetChromeMock());

  describe("allowlist", () => {
    it("allows GET /api/v2/profile/ping", () => {
      expect(isAllowed("GET", "/api/v2/profile/ping")).toBe(true);
    });

    it("allows GET weekly with user param", () => {
      expect(
        isAllowed("GET", "/api/v2/workplan/weekly/2026-04-13?user=28035")
      ).toBe(true);
    });

    it("allows GET daily with user and source params", () => {
      expect(
        isAllowed(
          "GET",
          "/api/v2/workplan/daily/2026-04-13?user=28035&source=sidebar"
        )
      ).toBe(true);
    });

    it("allows GET tooltip by activity id", () => {
      expect(
        isAllowed("GET", "/api/v2/workplan/tooltip/activity/17722582")
      ).toBe(true);
    });

    it("blocks disallowed paths", () => {
      expect(isAllowed("GET", "/api/v2/activities/17722582")).toBe(false);
    });

    it("blocks POST on any path", () => {
      expect(isAllowed("POST", "/api/v2/profile/ping")).toBe(false);
    });

    it("blocks DELETE on any path", () => {
      expect(isAllowed("DELETE", "/api/v2/profile/ping")).toBe(false);
    });

    it("blocks arbitrary query params on weekly", () => {
      expect(
        isAllowed("GET", "/api/v2/workplan/weekly/2026-04-13?admin=true")
      ).toBe(false);
    });

    it("blocks path traversal attempts", () => {
      expect(
        isAllowed("GET", "/api/v2/workplan/weekly/../../admin/users")
      ).toBe(false);
    });

    it("blocks non-date path segments", () => {
      expect(isAllowed("GET", "/api/v2/workplan/weekly/abc")).toBe(false);
    });
  });

  describe("handleFetch", () => {
    it("rejects disallowed paths without fetching", async () => {
      const res = await handleFetch({
        path: "/api/v2/admin/users",
        method: "GET",
      });

      expect(res).toEqual({
        ok: false,
        error: "Blocked: disallowed path or method",
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("returns session expired on redirect", async () => {
      fetch.mockResolvedValue({
        ok: true,
        redirected: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      const res = await handleFetch({
        path: "/api/v2/profile/ping",
        method: "GET",
      });

      expect(res).toEqual({ ok: false, error: "Session expired" });
    });

    it("returns parsed JSON on success", async () => {
      const data = { success: true, data: { user: { id: 1 } } };
      fetch.mockResolvedValue({
        ok: true,
        redirected: false,
        status: 200,
        json: () => Promise.resolve(data),
      });

      const res = await handleFetch({
        path: "/api/v2/profile/ping",
        method: "GET",
      });

      expect(res).toEqual({ ok: true, status: 200, data });
    });

    it("returns error on non-2xx status", async () => {
      fetch.mockResolvedValue({
        ok: false,
        redirected: false,
        status: 500,
      });

      const res = await handleFetch({
        path: "/api/v2/profile/ping",
        method: "GET",
      });

      expect(res).toEqual({
        ok: false,
        status: 500,
        error: "Request failed",
      });
    });

    it("returns timeout error on abort", async () => {
      fetch.mockImplementation(
        () =>
          new Promise((_, reject) => {
            const err = new Error("Aborted");
            err.name = "AbortError";
            setTimeout(() => reject(err), 10);
          })
      );

      const res = await handleFetch({
        path: "/api/v2/profile/ping",
        method: "GET",
      });

      expect(res).toEqual({ ok: false, error: "Request timed out" });
    });
  });
});
