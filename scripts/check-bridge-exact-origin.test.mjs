import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { runCheck } from "./check-bridge-exact-origin.mjs";

const APP = "https://kaiord.com/*";
const DEV = ["http://localhost:5173/*", "http://localhost:5174/*"];

const manifest = ({ connect = [APP], announce = [APP], ids } = {}) =>
  JSON.stringify({
    manifest_version: 3,
    content_scripts: [
      { matches: ["https://connect.example.com/*"], js: ["content.js"] },
      { matches: announce, js: ["bridge-identity.js", "kaiord-announce.js"] },
    ],
    externally_connectable: { matches: connect, ...(ids ? { ids } : {}) },
  });

const DEV_MANIFEST = manifest({
  connect: [...DEV, APP],
  announce: [APP, ...DEV],
});

const withRepo = (files, run) => {
  const root = mkdtempSync(join(tmpdir(), "bridge-exact-origin-"));
  try {
    for (const [rel, content] of Object.entries(files)) {
      const full = join(root, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content, "utf8");
    }
    run(runCheck({ repoRoot: root }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const bridge = (overrides = {}) => ({
  "packages/x-bridge/manifest.json": DEV_MANIFEST,
  "packages/x-bridge/manifest.prod.json": manifest(),
  "packages/x-bridge/background.js":
    'const APP_ORIGIN = "https://kaiord.com";\n',
  ...overrides,
});

const details = (found) => found.map((v) => `${v.file}: ${v.detail}`);

test("(a) the real bridges answer the exact App origin only", () => {
  assert.deepEqual(details(runCheck()), []);
});

test("(b) passes the exact App origin plus the dev ports in the dev manifest", () => {
  withRepo(bridge(), (found) => assert.deepEqual(details(found), []));
});

test("(c) flags a subdomain wildcard in externally_connectable", () => {
  withRepo(
    bridge({
      "packages/x-bridge/manifest.prod.json": manifest({
        connect: [APP, "https://*.kaiord.com/*"],
      }),
    }),
    (found) => {
      assert.equal(found.length, 1);
      assert.equal(found[0].rule, "R-BridgeExactOrigin");
      assert.equal(found[0].file, "packages/x-bridge/manifest.prod.json");
      assert.match(found[0].detail, /\*\.kaiord\.com/);
    }
  );
});

test("(d) flags a wildcard on the announce content script, dev manifest included", () => {
  withRepo(
    bridge({
      "packages/x-bridge/manifest.json": manifest({
        connect: [...DEV, APP],
        announce: [APP, "https://*.kaiord.com/*"],
      }),
    }),
    (found) => {
      assert.equal(found.length, 1);
      assert.equal(found[0].file, "packages/x-bridge/manifest.json");
    }
  );
});

test("(e) flags every other wildcard and foreign origin shape", () => {
  for (const pattern of [
    "<all_urls>",
    "*://*/*",
    "https://*/*",
    "*://kaiord.com/*",
    "https://kaiord.com.evil.example/*",
    "https://www.kaiord.com/*",
    "http://kaiord.com/*",
  ]) {
    withRepo(
      bridge({
        "packages/x-bridge/manifest.prod.json": manifest({
          connect: [APP, pattern],
        }),
      }),
      (found) => assert.equal(found.length, 1, pattern)
    );
  }
});

test("(f) flags a dev origin in the production manifest", () => {
  withRepo(
    bridge({
      "packages/x-bridge/manifest.prod.json": manifest({
        connect: [APP, DEV[0]],
        announce: [APP, "http://localhost/*"],
      }),
    }),
    (found) => assert.equal(found.length, 2)
  );
});

test("(g) flags a wildcard extension id in externally_connectable", () => {
  withRepo(
    bridge({
      "packages/x-bridge/manifest.prod.json": manifest({ ids: ["*"] }),
    }),
    (found) => {
      assert.equal(found.length, 1);
      assert.match(found[0].detail, /ids/);
    }
  );
});

test("(h) flags a manifest that does not declare the App origin", () => {
  withRepo(
    bridge({
      "packages/x-bridge/manifest.prod.json": manifest({ connect: [] }),
    }),
    (found) => assert.equal(found.length, 1)
  );
});

test("(i) flags runtime code that matches the App origin by pattern", () => {
  withRepo(
    bridge({
      "packages/x-bridge/background.js":
        "const RE = /^https:\\/\\/([a-z0-9-]+\\.)?kaiord\\.com$/;\n",
      "packages/_shared/bridge-core/envelope.js":
        'const ORIGINS = ["https://*.kaiord.com"];\n',
    }),
    (found) => {
      assert.deepEqual(found.map((v) => v.file).sort(), [
        "packages/_shared/bridge-core/envelope.js",
        "packages/x-bridge/background.js",
      ]);
    }
  );
});

test("(j) ignores comments and test files", () => {
  withRepo(
    bridge({
      "packages/x-bridge/background.js":
        "// once matched *.kaiord.com\n/* kaiord\\.com */\nconst A = 1;\n",
      "packages/x-bridge/test/background.test.js":
        'const sender = { origin: "https://*.kaiord.com" };\n',
    }),
    (found) => assert.deepEqual(details(found), [])
  );
});

test("(k) treats finding no bridge as a fault, not a pass", () => {
  withRepo({ "packages/core/package.json": "{}" }, (found) => {
    assert.equal(found.length, 1);
    assert.match(found[0].detail, /no bridge/);
  });
});

test("(l) treats a bridge without a manifest as a fault", () => {
  withRepo(
    bridge({ "packages/y-bridge/background.js": "const A = 1;\n" }),
    (found) => {
      assert.equal(found.length, 1);
      assert.equal(found[0].file, "packages/y-bridge/manifest.json");
    }
  );
});

test("(m) flags a dev announce pattern that matches every localhost port", () => {
  withRepo(
    bridge({
      "packages/x-bridge/manifest.json": manifest({
        connect: [...DEV, APP],
        announce: [APP, "http://localhost/*"],
      }),
    }),
    (found) => {
      assert.equal(found.length, 1);
      assert.match(found[0].detail, /http:\/\/localhost\/\*/);
    }
  );
});

const PARTIAL_MATCHES = {
  endsWith: 'if (sender.origin.endsWith("kaiord.com")) ok();',
  includes: 'const ok = sender.url.includes("https://kaiord.com");',
  startsWith: 'const ok = sender.origin.startsWith("https://kaiord.com");',
  indexOf: 'const ok = origin.indexOf("kaiord.com") !== -1;',
  match: "const ok = origin.match(/kaiord.com/);",
  RegExp: 'const ok = new RegExp("kaiord.com").test(origin);',
  hostname: 'const ok = new URL(sender.url).hostname === "kaiord.com";',
  "a bound name": [
    'const APP = "https://kaiord.com";',
    "const ok = sender.origin",
    "  .startsWith(APP);",
  ].join("\n"),
  "a literal on the left": 'const ok = "https://kaiord.com/app".includes(o);',
};

test("(n) flags every suffix, substring or prefix match of the App origin", () => {
  for (const [label, code] of Object.entries(PARTIAL_MATCHES)) {
    withRepo(
      bridge({ "packages/x-bridge/background.js": `${code}\n` }),
      (found) => {
        assert.deepEqual(
          found.map((v) => v.file),
          ["packages/x-bridge/background.js"],
          label
        );
      }
    );
  }
});

test("(o) scans every shipped file under the bridge, nested folders included", () => {
  withRepo(
    bridge({
      "packages/x-bridge/lib/deep/origin.js":
        'export const ok = (o) => o.endsWith(".kaiord.com");\n',
      "packages/_shared/bridge-core/sub/gate.js":
        'const ok = (o) => o.includes("kaiord.com");\n',
      "packages/x-bridge/node_modules/dep/index.js":
        'const ok = (o) => o.endsWith("kaiord.com");\n',
      "packages/x-bridge/test/deep/x.test.js":
        'const ok = (o) => o.endsWith("kaiord.com");\n',
      "packages/x-bridge/vitest.config.js":
        'const ok = (o) => o.endsWith("kaiord.com");\n',
    }),
    (found) => {
      assert.deepEqual(found.map((v) => v.file).sort(), [
        "packages/_shared/bridge-core/sub/gate.js",
        "packages/x-bridge/lib/deep/origin.js",
      ]);
    }
  );
});

test("(p) lets the shared gate compare lists and keeps a plain App URL legal", () => {
  withRepo(
    bridge({
      "packages/x-bridge/bridge-envelope.js": [
        'const APP_ORIGIN = "https://kaiord.com";',
        'const DEV_ORIGINS = ["http://localhost:5173"];',
        "const ok = (o) => o === APP_ORIGIN || DEV_ORIGINS.includes(o);",
      ].join("\n"),
      "packages/x-bridge/popup.js": [
        'const OPEN_EDITOR_URL = "https://kaiord.com/app/";',
        "render({ primaryHref: OPEN_EDITOR_URL });",
        'const names = ["a", "b"].includes(name);',
      ].join("\n"),
    }),
    (found) => assert.deepEqual(details(found), [])
  );
});
