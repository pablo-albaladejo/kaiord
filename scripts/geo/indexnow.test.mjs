import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ENDPOINT,
  diffFiles,
  diffSitemaps,
  findKey,
  parseSitemap,
  submit,
} from "./indexnow.mjs";

const KEY = "0123456789abcdef0123456789abcdef";

const sitemap = (entries) =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset>${entries
    .map(([loc, lastmod]) =>
      lastmod
        ? `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`
        : `<url><loc>${loc}</loc></url>`
    )
    .join("")}</urlset>`;

const quiet = () => {
  const lines = { log: [], warn: [] };
  return {
    lines,
    log: (m) => lines.log.push(m),
    warn: (m) => lines.warn.push(m),
  };
};

const withDir = (files, fn) => {
  const dir = mkdtempSync(join(tmpdir(), "indexnow-"));
  try {
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(dir, name), content);
    }
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe("parseSitemap", () => {
  it("should map every loc to its lastmod and decode entities", () => {
    // Arrange
    const xml = sitemap([
      ["https://kaiord.com/", "2026-09-28T10:00:00.000Z"],
      ["https://kaiord.com/docs/a?x=1&amp;y=2", ""],
    ]);

    // Act
    const entries = parseSitemap(xml);

    // Assert
    assert.deepEqual(
      [...entries],
      [
        ["https://kaiord.com/", "2026-09-28T10:00:00.000Z"],
        ["https://kaiord.com/docs/a?x=1&y=2", ""],
      ]
    );
  });

  it("should decode each entity once so an escaped ampersand stays literal", () => {
    // Arrange
    const xml = sitemap([["https://kaiord.com/q?a=&amp;lt;b&amp;amp;", "1"]]);

    // Act
    const [loc] = parseSitemap(xml).keys();

    // Assert
    assert.equal(loc, "https://kaiord.com/q?a=&lt;b&amp;");
  });
});

describe("diffSitemaps", () => {
  it("should list added, removed and re-dated URLs and nothing unchanged", () => {
    // Arrange
    const live = new Map([
      ["https://kaiord.com/", "2026-09-01"],
      ["https://kaiord.com/docs/same", "2026-09-01"],
      ["https://kaiord.com/docs/gone", "2026-09-01"],
    ]);
    const built = new Map([
      ["https://kaiord.com/", "2026-09-28"],
      ["https://kaiord.com/docs/same", "2026-09-01"],
      ["https://kaiord.com/docs/new", "2026-09-28"],
    ]);

    // Act
    const changed = diffSitemaps(live, built);

    // Assert
    assert.deepEqual(changed, [
      "https://kaiord.com/",
      "https://kaiord.com/docs/gone",
      "https://kaiord.com/docs/new",
    ]);
  });

  it("should return nothing when the sitemaps are identical", () => {
    // Arrange
    const same = new Map([["https://kaiord.com/", "2026-09-01"]]);

    // Act
    const changed = diffSitemaps(same, new Map(same));

    // Assert
    assert.deepEqual(changed, []);
  });

  it("should drop URLs on any other host", () => {
    // Arrange
    const built = new Map([
      ["https://www.kaiord.com/x", "1"],
      ["https://example.com/", "1"],
      ["https://kaiord.com/y", "1"],
    ]);

    // Act
    const changed = diffSitemaps(new Map(), built);

    // Assert
    assert.deepEqual(changed, ["https://kaiord.com/y"]);
  });
});

describe("diffFiles", () => {
  it("should diff the live sitemaps against the built ones", () => {
    // Arrange
    const files = {
      "old.xml": sitemap([
        ["https://kaiord.com/a", "1"],
        ["https://kaiord.com/b", "1"],
      ]),
      "new.xml": sitemap([
        ["https://kaiord.com/a", "1"],
        ["https://kaiord.com/b", "2"],
      ]),
    };

    withDir(files, (dir) => {
      // Act
      const urls = diffFiles({
        oldFiles: [join(dir, "old.xml")],
        newFiles: [join(dir, "new.xml")],
        log: quiet(),
      });

      // Assert
      assert.deepEqual(urls, ["https://kaiord.com/b"]);
    });
  });

  it("should skip with a warning when the live sitemap could not be fetched", () => {
    // Arrange
    const log = quiet();

    withDir({ "new.xml": sitemap([["https://kaiord.com/a", "1"]]) }, (dir) => {
      // Act
      const urls = diffFiles({
        oldFiles: [join(dir, "missing.xml")],
        newFiles: [join(dir, "new.xml")],
        log,
      });

      // Assert
      assert.deepEqual(urls, []);
      assert.match(log.lines.warn[0], /^::warning::IndexNow: the live sitemap/);
    });
  });

  it("should fail when the built sitemap has no URL", () => {
    // Arrange
    const files = {
      "old.xml": sitemap([["https://kaiord.com/a", "1"]]),
      "new.xml": "<urlset></urlset>",
    };

    withDir(files, (dir) => {
      // Act + Assert
      assert.throws(
        () =>
          diffFiles({
            oldFiles: [join(dir, "old.xml")],
            newFiles: [join(dir, "new.xml")],
            log: quiet(),
          }),
        /no <url><loc>/
      );
    });
  });
});

describe("findKey", () => {
  it("should return the key whose file content is the key", () => {
    // Arrange
    const files = { [`${KEY}.txt`]: KEY, "robots.txt": "User-agent: *" };

    // Act
    const key = withDir(files, (dir) => findKey(dir));

    // Assert
    assert.equal(key, KEY);
  });

  it("should fail when no key file exists", () => {
    // Arrange
    const files = { "robots.txt": "User-agent: *" };

    // Act + Assert
    withDir(files, (dir) => assert.throws(() => findKey(dir), /found 0/));
  });

  it("should not accept a key file whose content differs from its name", () => {
    // Arrange
    const files = { [`${KEY}.txt`]: "something else" };

    // Act + Assert
    withDir(files, (dir) => assert.throws(() => findKey(dir), /found 0/));
  });
});

describe("submit", () => {
  const recordingFetch = (status) => {
    const calls = [];
    const fetch = async (url, init) => {
      calls.push({ url, init });
      return { status };
    };
    return { calls, fetch };
  };

  it("should skip without calling the network when nothing changed", async () => {
    // Arrange
    const { calls, fetch } = recordingFetch(200);
    const log = quiet();

    // Act
    const result = await submit({ urls: [], key: KEY, fetch, log });

    // Assert
    assert.equal(result, "skipped");
    assert.equal(calls.length, 0);
    assert.deepEqual(log.lines.log, ["IndexNow: nothing changed, skipping"]);
  });

  for (const status of [200, 202]) {
    it(`should post host, key, keyLocation and urlList and log ${status}`, async () => {
      // Arrange
      const { calls, fetch } = recordingFetch(status);
      const log = quiet();
      const urls = ["https://kaiord.com/", "https://kaiord.com/docs/"];

      // Act
      const result = await submit({ urls, key: KEY, fetch, log });

      // Assert
      assert.equal(result, "ok");
      assert.equal(calls[0].url, ENDPOINT);
      assert.equal(calls[0].init.method, "POST");
      assert.deepEqual(JSON.parse(calls[0].init.body), {
        host: "kaiord.com",
        key: KEY,
        keyLocation: `https://kaiord.com/${KEY}.txt`,
        urlList: urls,
      });
      assert.deepEqual(log.lines.log, [`IndexNow ${status} for 2 URL(s)`]);
      assert.deepEqual(log.lines.warn, []);
    });
  }

  it("should warn, not fail, on any other status", async () => {
    // Arrange
    const { fetch } = recordingFetch(403);
    const log = quiet();

    // Act
    const result = await submit({
      urls: ["https://kaiord.com/"],
      key: KEY,
      fetch,
      log,
    });

    // Assert
    assert.equal(result, "warned");
    assert.match(log.lines.warn[0], /^::warning::IndexNow answered 403/);
  });

  it(
    "should abort a request that hangs and warn instead",
    { timeout: 2000 },
    async () => {
      // Arrange
      const log = quiet();
      // AbortSignal.timeout's timer is unref'd: a real request's socket is
      // what keeps the process alive until it fires. This fake holds a
      // ref'd timer in its place, or the event loop drains first (Node 22).
      const hanging = (_url, init) =>
        new Promise((_resolve, reject) => {
          const socket = setTimeout(() => {}, 5000);
          init?.signal?.addEventListener("abort", () => {
            clearTimeout(socket);
            reject(init.signal.reason);
          });
        });

      // Act
      const result = await submit({
        urls: ["https://kaiord.com/"],
        key: KEY,
        fetch: hanging,
        log,
        timeoutMs: 20,
      });

      // Assert
      assert.equal(result, "warned");
      assert.match(log.lines.warn[0], /^::warning::IndexNow request failed/);
    }
  );

  it("should bound the real request at 20 seconds by default", async () => {
    // Arrange
    const { calls, fetch } = recordingFetch(200);

    // Act
    await submit({
      urls: ["https://kaiord.com/"],
      key: KEY,
      fetch,
      log: quiet(),
    });

    // Assert
    assert.ok(calls[0].init.signal instanceof AbortSignal);
    assert.equal(calls[0].init.signal.aborted, false);
  });

  it("should warn, not fail, on a network error", async () => {
    // Arrange
    const log = quiet();
    const fetch = async () => {
      throw new Error("ECONNRESET");
    };

    // Act
    const result = await submit({
      urls: ["https://kaiord.com/"],
      key: KEY,
      fetch,
      log,
    });

    // Assert
    assert.equal(result, "warned");
    assert.match(log.lines.warn[0], /ECONNRESET/);
  });
});

describe("the committed key", () => {
  it("should be exactly one landing public file served at the site root", () => {
    // Arrange + Act
    const key = findKey();

    // Assert
    assert.match(key, /^[0-9a-f]{32}$/);
  });
});
