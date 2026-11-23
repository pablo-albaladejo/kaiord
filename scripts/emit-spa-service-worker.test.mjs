import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  emitServiceWorker,
  readWorkerConfig,
} from "./emit-spa-service-worker.mjs";

const put = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

const hex = (text) => createHash("sha256").update(text).digest("hex");

describe("emit-spa-service-worker", () => {
  let app;

  beforeEach(() => {
    app = mkdtempSync(join(tmpdir(), "emit-sw-"));
    put(join(app, "index.html"), "<html>shell</html>");
    put(join(app, "manifest.webmanifest"), "{}");
    put(join(app, "fonts/inter.woff2"), "font");
    put(join(app, "assets/index-AAAA1111.js"), "entry");
    put(join(app, "assets/Daily-BBBB2222.js"), "daily");
    put(join(app, "assets/index-AAAA1111.js.map"), "map");
    put(join(app, "assets/.keep"), "");
    put(join(app, "version.json"), '{"sha":"x"}\n');
    put(join(app, "og-image-editor.png"), "og");
    put(join(app, "AGENTS.md"), "notes");
  });

  afterEach(() => rmSync(app, { recursive: true, force: true }));

  it("should list every shipped file under the scope, with its SHA-256, and nothing excluded", () => {
    // Arrange
    const scope = "/app/";

    // Act
    emitServiceWorker(app, { scope });
    const config = readWorkerConfig(readFileSync(join(app, "sw.js"), "utf8"));

    // Assert
    assert.deepEqual(
      config.manifest.map(({ url, revision }) => [url, revision]),
      [
        ["/app/assets/Daily-BBBB2222.js", hex("daily")],
        ["/app/assets/index-AAAA1111.js", hex("entry")],
        ["/app/fonts/inter.woff2", hex("font")],
        ["/app/index.html", hex("<html>shell</html>")],
        ["/app/manifest.webmanifest", hex("{}")],
      ]
    );
    assert.equal(config.scope, "/app/");
    assert.equal(config.mode, "normal");
  });

  it("should key hashed chunks by their URL and every other file by ?__rev=<revision>", () => {
    // Arrange
    const scope = "/app/";

    // Act
    emitServiceWorker(app, { scope });
    const { manifest } = readWorkerConfig(
      readFileSync(join(app, "sw.js"), "utf8")
    );
    const keyOf = (url) => manifest.find((entry) => entry.url === url).key;

    // Assert
    assert.equal(keyOf("/app/assets/Daily-BBBB2222.js"), "/app/assets/Daily-BBBB2222.js");
    assert.equal(
      keyOf("/app/index.html"),
      `/app/index.html?__rev=${hex("<html>shell</html>")}`
    );
    assert.equal(
      keyOf("/app/fonts/inter.woff2"),
      `/app/fonts/inter.woff2?__rev=${hex("font")}`
    );
  });

  it("should name the version after every url and revision, so any shipped byte changes the worker", () => {
    // Arrange
    emitServiceWorker(app, { scope: "/app/" });
    const before = readWorkerConfig(readFileSync(join(app, "sw.js"), "utf8"));

    // Act
    put(join(app, "index.html"), "<html>shell v2</html>");
    emitServiceWorker(app, { scope: "/app/" });
    const after = readWorkerConfig(readFileSync(join(app, "sw.js"), "utf8"));

    // Assert
    assert.match(before.version, /^[0-9a-f]{12}$/);
    assert.notEqual(after.version, before.version);
  });

  it("should not let a previous sw.js into the manifest", () => {
    // Arrange
    emitServiceWorker(app, { scope: "/app/" });

    // Act
    emitServiceWorker(app, { scope: "/app/" });
    const { manifest } = readWorkerConfig(
      readFileSync(join(app, "sw.js"), "utf8")
    );

    // Assert
    assert.equal(manifest.some(({ url }) => url.endsWith("sw.js")), false);
  });

  it("should emit a kill worker with no fetch handler and no claim, that navigates only the clients it controls", () => {
    // Arrange
    const scope = "/app/";

    // Act
    emitServiceWorker(app, { scope, kill: true });
    const source = readFileSync(join(app, "sw.js"), "utf8");

    // Assert
    assert.equal(readWorkerConfig(source).mode, "kill");
    assert.doesNotMatch(source, /addEventListener\(\s*["']fetch["']/);
    assert.doesNotMatch(source, /\.claim\(/);
    assert.doesNotMatch(source, /includeUncontrolled/);
    assert.match(source, /skipWaiting\(\)/);
    assert.match(source, /registration\.unregister\(\)/);
    assert.match(source, /\.navigate\(/);
  });

  it("should emit the normal worker from its source, after the config line", () => {
    // Arrange
    const scope = "/app/";

    // Act
    emitServiceWorker(app, { scope });
    const source = readFileSync(join(app, "sw.js"), "utf8");

    // Assert
    assert.match(source, /^const SW = \{.*\};\n/);
    assert.match(source, /addEventListener\("fetch"/);
    assert.match(source, /cache: "reload"/);
  });

  it("should refuse a scope that is not an absolute directory path", () => {
    // Arrange
    const scope = "app";

    // Act
    const emit = () => emitServiceWorker(app, { scope });

    // Assert
    assert.throws(emit, /scope/);
  });
});
