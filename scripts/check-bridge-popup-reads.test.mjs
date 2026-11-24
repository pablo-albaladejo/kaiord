import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { runCheck } from "./check-bridge-popup-reads.mjs";

const KEYS = { "x-bridge": { bridgeHealth: "popup state" } };

const MANIFEST = JSON.stringify({
  manifest_version: 3,
  background: { service_worker: "background.js" },
  content_scripts: [
    { matches: ["https://kaiord.com/*"], js: ["kaiord-announce.js"] },
  ],
});

// A bridge whose popup reads one thing (`read-week`) through parser.js.
const background = ({
  popupReads = 'const POPUP_READS = new Set(["read-week"]);',
  popupScripts = 'const POPUP_READ_SCRIPTS = ["parser.js"];',
  external = '"ping", "request"',
  internal = '"ping", "read-week"',
  pingCase = "return await checkSession();",
  weekPath = "`/api/week/${date}`",
  weekBody = "const res = await gatedFetch(path);",
  extra = "",
} = {}) =>
  [
    "const ALLOWED = [",
    '  { method: "GET", pattern: /^\\/api\\/ping$/ },',
    '  { method: "GET", pattern: /^\\/api\\/week\\/\\d{4}-\\d{2}-\\d{2}$/ },',
    "];",
    'const parser = loadScript("parser.js");',
    "const isAllowed = (m, p) => ALLOWED.some((r) => r.pattern.test(p));",
    "const gatedFetch = async (path) => {",
    '  if (!isAllowed("GET", path)) return { ok: false };',
    "  return fetch(path);",
    "};",
    "const checkSession = async () => {",
    '  const res = await gatedFetch("/api/ping");',
    "  return { session: res.ok };",
    "};",
    "const readWeek = async (date) => {",
    `  const path = ${weekPath};`,
    `  ${weekBody}`,
    "  return parser.count(res);",
    "};",
    extra,
    "const handleAction = async (message) => {",
    "  switch (message.action) {",
    '    case "ping":',
    `      ${pingCase}`,
    '    case "read-week":',
    "      return await readWeek(message.date);",
    "    default:",
    "      throw new Error('Unknown');",
    "  }",
    "};",
    `const EXTERNAL_ACTIONS = new Set([${external}]);`,
    `const INTERNAL_ACTIONS = new Set([${internal}]);`,
    popupReads,
    popupScripts,
    "",
  ].join("\n");

const POPUP = [
  "const load = async () => {",
  '  const res = await chrome.runtime.sendMessage({ action: "read-week" });',
  "  render(res);",
  "};",
  "",
].join("\n");

const HEALTH = [
  'const KD_HEALTH_KEY = "bridgeHealth";',
  "const record = (r) => chrome.storage.local.set({ [KD_HEALTH_KEY]: r });",
  "",
].join("\n");

const withRepo = (overrides, run) => {
  const root = mkdtempSync(join(tmpdir(), "bridge-popup-reads-"));
  const files = {
    "packages/x-bridge/manifest.json": MANIFEST,
    "packages/x-bridge/background.js": background(),
    "packages/x-bridge/parser.js": "const count = (r) => r.length;\n",
    "packages/x-bridge/popup.js": POPUP,
    "packages/x-bridge/bridge-popup-health.js": HEALTH,
    ...overrides,
  };
  try {
    for (const [rel, content] of Object.entries(files)) {
      if (content === null) continue;
      const full = join(root, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content, "utf8");
    }
    run(runCheck({ repoRoot: root, storageKeys: KEYS }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const rules = (found) => found.map((v) => v.rule);
const details = (found) => found.map((v) => `${v.rule} ${v.file}: ${v.detail}`);

test("should pass the five real bridges", () => {
  assert.deepEqual(details(runCheck()), []);
});

test("should pass a bridge whose popup read stays behind its popup", () => {
  withRepo({}, (found) => assert.deepEqual(details(found), []));
});

test("should fail a bridge that declares no popup reads", () => {
  withRepo(
    { "packages/x-bridge/background.js": background({ popupReads: "" }) },
    (found) => assert.deepEqual(rules(found), ["R-PopupReadsDeclared"])
  );
});

test("should fail a popup read the App can send", () => {
  withRepo(
    {
      "packages/x-bridge/background.js": background({
        external: '"ping", "request", "read-week"',
      }),
    },
    (found) => assert.deepEqual(rules(found), ["R-PopupReadsDeclared"])
  );
});

test("should fail a popup read the popup cannot send", () => {
  withRepo(
    { "packages/x-bridge/background.js": background({ internal: '"ping"' }) },
    (found) => assert.deepEqual(rules(found), ["R-PopupReadsDeclared"])
  );
});

test("should fail an App-facing action that calls the popup's read", () => {
  withRepo(
    {
      "packages/x-bridge/background.js": background({
        pingCase: "return await readWeek(message.date);",
      }),
    },
    (found) => {
      assert.deepEqual(
        new Set(rules(found)),
        new Set(["R-PopupReadsUnreachable"])
      );
      assert.ok(found.some((v) => /"ping" reaches readWeek/.test(v.detail)));
    }
  );
});

test("should fail an App-facing action that reaches a popup-read script through a helper", () => {
  withRepo(
    {
      "packages/x-bridge/background.js": background({
        extra: "const summarise = (r) => parser.count(r);",
        pingCase: "return summarise(await checkSession());",
      }),
    },
    (found) => {
      assert.deepEqual(rules(found), ["R-PopupReadsUnreachable"]);
      assert.match(found[0].detail, /"ping" reaches parser/);
    }
  );
});

test("should fail a content script that loads a popup-read script", () => {
  withRepo(
    {
      "packages/x-bridge/manifest.json": JSON.stringify({
        content_scripts: [{ matches: ["https://p/*"], js: ["parser.js"] }],
      }),
    },
    (found) => assert.deepEqual(rules(found), ["R-PopupReadsUnreachable"])
  );
});

test("should fail a popup read whose path is not on the closed list", () => {
  withRepo(
    {
      "packages/x-bridge/background.js": background({
        weekPath: "`/api/month/${date}`",
      }),
    },
    (found) => {
      assert.deepEqual(rules(found), ["R-PopupReadsClosedList"]);
      assert.match(found[0].detail, /\/api\/month\//);
    }
  );
});

test("should fail a popup read that fetches around the closed list", () => {
  withRepo(
    {
      "packages/x-bridge/background.js": background({
        weekBody: "const res = await fetch(path);",
      }),
    },
    (found) => {
      assert.deepEqual(rules(found), ["R-PopupReadsClosedList"]);
      assert.match(found[0].detail, /readWeek fetches without isAllowed/);
    }
  );
});

test("should fail a popup-read script that reaches the network or chrome", () => {
  withRepo(
    {
      "packages/x-bridge/parser.js":
        "const count = (r) => fetch('https://x.example/' + r.length);\n",
    },
    (found) => assert.deepEqual(rules(found), ["R-PopupReadsClosedList"])
  );
});

test("should fail a popup read that writes what it read to storage", () => {
  withRepo(
    {
      "packages/x-bridge/background.js": background({
        weekBody:
          "const res = await gatedFetch(path); await chrome.storage.local.set({ bridgeHealth: res });",
      }),
    },
    (found) => assert.deepEqual(rules(found), ["R-PopupReadsNotStored"])
  );
});

test("should fail a popup that writes to storage itself", () => {
  withRepo(
    {
      "packages/x-bridge/popup.js": `${POPUP}chrome.storage.local.set({ bridgeHealth: 1 });\n`,
    },
    (found) => {
      assert.deepEqual(rules(found), ["R-PopupReadsNotStored"]);
      assert.match(found[0].file, /popup\.js$/);
    }
  );
});

test("should fail a storage write of a key not on the bridge's list", () => {
  withRepo(
    {
      "packages/x-bridge/bridge-popup-health.js":
        "chrome.storage.local.set({ lastWeeklyRollup: { planned: 3 } });\n",
    },
    (found) => {
      assert.deepEqual(rules(found), ["R-PopupReadsNotStored"]);
      assert.match(found[0].detail, /lastWeeklyRollup/);
    }
  );
});

test("should fail a storage write whose keys cannot be read from the source", () => {
  withRepo(
    {
      "packages/x-bridge/bridge-popup-health.js":
        "const write = (o) => chrome.storage.session.set(o);\n",
    },
    (found) => assert.deepEqual(rules(found), ["R-PopupReadsNotStored"])
  );
});

test("should report finding no bridge as a fault", () => {
  const root = mkdtempSync(join(tmpdir(), "bridge-popup-reads-"));
  try {
    mkdirSync(join(root, "packages"));
    assert.deepEqual(rules(runCheck({ repoRoot: root, storageKeys: {} })), [
      "R-PopupReadsDeclared",
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
