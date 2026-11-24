import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { checkServiceWorker } from "./check-spa-service-worker.mjs";
import { emitServiceWorker } from "./emit-spa-service-worker.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const put = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

const MANIFEST = JSON.stringify({
  icons: [{ src: "/app/app-icon-192.png" }, { src: "/app/app-icon-512.png" }],
});

const rewriteConfig = (app, edit) => {
  const path = join(app, "sw.js");
  const source = readFileSync(path, "utf8");
  const [line, ...rest] = source.split("\n");
  const config = edit(JSON.parse(line.slice("const SW = ".length, -1)));
  writeFileSync(
    path,
    [`const SW = ${JSON.stringify(config)};`, ...rest].join("\n")
  );
};

describe("check-spa-service-worker", () => {
  let app;
  const normal = { base: "/app/", mode: "normal" };

  beforeEach(() => {
    app = mkdtempSync(join(tmpdir(), "check-sw-"));
    put(join(app, "index.html"), "<html>shell</html>");
    put(join(app, "manifest.webmanifest"), MANIFEST);
    put(join(app, "app-icon-192.png"), "192");
    put(join(app, "app-icon-512.png"), "512");
    put(join(app, "assets/index-AAAA1111.js"), "entry");
    put(join(app, "assets/index-AAAA1111.js.map"), "map");
    put(join(app, "version.json"), "{}");
    put(join(app, "og-image-editor.png"), "og");
  });

  afterEach(() => rmSync(app, { recursive: true, force: true }));

  it("should pass the tree the emitter wrote", () => {
    // Arrange
    emitServiceWorker(app, { scope: "/app/" });

    // Act
    const problems = checkServiceWorker(app, normal);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should fail when sw.js is missing", () => {
    // Arrange

    // Act
    const problems = checkServiceWorker(app, normal);

    // Assert
    assert.deepEqual(problems, ["sw.js is missing"]);
  });

  it("should fail and name index.html when it was rewritten after emit", () => {
    // Arrange
    emitServiceWorker(app, { scope: "/app/" });
    put(join(app, "index.html"), "<html>shell, rewritten</html>");

    // Act
    const problems = checkServiceWorker(app, normal);

    // Assert
    assert.deepEqual(problems, [
      "index.html: shipped bytes do not match its revision",
    ]);
  });

  it("should fail on an empty manifest", () => {
    // Arrange
    emitServiceWorker(app, { scope: "/app/" });
    rewriteConfig(app, (config) => ({ ...config, manifest: [] }));

    // Act
    const problems = checkServiceWorker(app, normal);

    // Assert
    assert.ok(problems.includes("the manifest is empty"));
  });

  it("should fail when a shipped chunk is missing from the manifest", () => {
    // Arrange
    emitServiceWorker(app, { scope: "/app/" });
    put(join(app, "assets/Daily-BBBB2222.js"), "late chunk");

    // Act
    const problems = checkServiceWorker(app, normal);

    // Assert
    assert.deepEqual(problems, [
      "assets/Daily-BBBB2222.js: shipped but not precached",
    ]);
  });

  it("should fail when a listed file is missing", () => {
    // Arrange
    emitServiceWorker(app, { scope: "/app/" });
    rmSync(join(app, "assets/index-AAAA1111.js"));

    // Act
    const problems = checkServiceWorker(app, normal);

    // Assert
    assert.deepEqual(problems, [
      "assets/index-AAAA1111.js: listed but not shipped",
    ]);
  });

  it("should fail when an excluded file is listed", () => {
    // Arrange
    emitServiceWorker(app, { scope: "/app/" });
    rewriteConfig(app, (config) => ({
      ...config,
      manifest: [
        ...config.manifest,
        {
          url: "/app/assets/index-AAAA1111.js.map",
          revision: "0",
          key: "/app/assets/index-AAAA1111.js.map",
        },
      ],
    }));

    // Act
    const problems = checkServiceWorker(app, normal);

    // Assert
    assert.ok(
      problems.includes("assets/index-AAAA1111.js.map: excluded but listed")
    );
  });

  it("should fail when the shell or an icon is not keyed by its revision", () => {
    // Arrange
    emitServiceWorker(app, { scope: "/app/" });
    rewriteConfig(app, (config) => ({
      ...config,
      manifest: config.manifest.map((entry) => ({ ...entry, key: entry.url })),
    }));

    // Act
    const problems = checkServiceWorker(app, normal);

    // Assert
    assert.deepEqual(problems.sort(), [
      "app-icon-192.png: not keyed by ?__rev=<revision>",
      "app-icon-512.png: not keyed by ?__rev=<revision>",
      "index.html: not keyed by ?__rev=<revision>",
      "manifest.webmanifest: not keyed by ?__rev=<revision>",
    ]);
  });

  it("should fail when the scope differs from the base", () => {
    // Arrange
    emitServiceWorker(app, { scope: "/" });

    // Act
    const problems = checkServiceWorker(app, normal);

    // Assert
    assert.ok(problems.includes("scope is / but the base is /app/"));
  });

  it("should fail a kill worker where a normal one was requested, and the reverse", () => {
    // Arrange
    emitServiceWorker(app, { scope: "/app/", kill: true });
    const killed = checkServiceWorker(app, normal);
    emitServiceWorker(app, { scope: "/app/" });

    // Act
    const normalAsKill = checkServiceWorker(app, {
      base: "/app/",
      mode: "kill",
    });

    // Assert
    assert.deepEqual(killed, ["mode is kill but the deploy asked for normal"]);
    assert.deepEqual(normalAsKill, [
      "mode is normal but the deploy asked for kill",
    ]);
  });

  it("should pass a kill worker when kill was requested, and fail one that grew a fetch handler", () => {
    // Arrange
    emitServiceWorker(app, { scope: "/app/", kill: true });
    const clean = checkServiceWorker(app, { base: "/app/", mode: "kill" });
    const path = join(app, "sw.js");
    writeFileSync(
      path,
      `${readFileSync(path, "utf8")}\nself.addEventListener("fetch", () => self.clients.claim());\n`
    );

    // Act
    const grown = checkServiceWorker(app, { base: "/app/", mode: "kill" });

    // Assert
    assert.deepEqual(clean, []);
    assert.deepEqual(grown.sort(), [
      "the kill worker calls clients.claim()",
      "the kill worker has a fetch handler",
    ]);
  });

  it("should exit 1 from the command line on a problem and 0 on a clean tree", () => {
    // Arrange
    const run = () =>
      spawnSync(
        process.execPath,
        [
          "scripts/check-spa-service-worker.mjs",
          ...["--app", app, "--base", "/app/", "--mode", "normal"],
        ],
        { cwd: ROOT }
      );
    const missing = run();
    emitServiceWorker(app, { scope: "/app/" });

    // Act
    const clean = run();

    // Assert
    assert.equal(missing.status, 1);
    assert.equal(clean.status, 0, String(clean.stderr));
  });
});
