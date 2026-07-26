// Smoke tests for package-extension.sh.
//
// The store zip is assembled by a whitelist copy; popup.html links
// popup.css, so a glob that misses *.css ships an unstyled popup to the
// Chrome Web Store (this actually happened — the glob covered only
// *.js/*.html for every published version before this test existed).
// Runs the real script against a tmpdir fixture package and inspects
// the produced zip listing.

import { strict as assert } from "node:assert";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_SRC = readFileSync(
  resolve(__dirname, "package-extension.sh"),
  "utf8"
);

const EXT = "fixture-bridge";
const VERSION = "0.1.0";
// Any bytes satisfy the icons pre-flight; the script copies, never decodes.
const FAKE_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

let root;
let zipListing;

before(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), "kaiord-pkg-test-")));
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(join(root, "scripts", "package-extension.sh"), SCRIPT_SRC);

  const pkgDir = join(root, "packages", EXT);
  mkdirSync(join(pkgDir, "icons"), { recursive: true });
  mkdirSync(join(pkgDir, "test"), { recursive: true });
  mkdirSync(join(pkgDir, "_locales", "en"), { recursive: true });
  writeFileSync(join(pkgDir, "package.json"), JSON.stringify({ version: VERSION }));
  writeFileSync(
    join(pkgDir, "manifest.prod.json"),
    JSON.stringify({ name: "x", version: VERSION })
  );
  writeFileSync(join(pkgDir, "icons", "icon16.png"), FAKE_PNG);
  writeFileSync(join(pkgDir, "_locales", "en", "messages.json"), "{}");
  writeFileSync(join(pkgDir, "background.js"), "// bg\n");
  writeFileSync(join(pkgDir, "popup.html"), "<link href=\"popup.css\">\n");
  writeFileSync(join(pkgDir, "popup.css"), ".status {}\n");
  writeFileSync(join(pkgDir, "vitest.config.js"), "export default {}\n");
  writeFileSync(join(pkgDir, "test", "popup.test.js"), "// never packaged\n");

  const run = spawnSync(
    "bash",
    [join(root, "scripts", "package-extension.sh"), EXT],
    { cwd: root, encoding: "utf8" }
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);

  const zip = join(root, "packages", EXT, "dist", `kaiord-${EXT}-${VERSION}.zip`);
  zipListing = execFileSync("unzip", ["-l", zip], { encoding: "utf8" });
});

after(() => {
  rmSync(root, { recursive: true, force: true });
});

test("zip contains popup.css (the popup would render unstyled without it)", () => {
  assert.match(zipListing, /popup\.css/);
});

test("zip contains the runtime whitelist: manifest, js, html, icons, locales", () => {
  for (const expected of [
    "manifest.json",
    "background.js",
    "popup.html",
    "icons/icon16.png",
    "_locales/en/messages.json",
  ]) {
    assert.ok(zipListing.includes(expected), `missing ${expected}`);
  }
});

test("zip excludes dev/test files: vitest.config and test/", () => {
  assert.doesNotMatch(zipListing, /vitest\.config/);
  assert.doesNotMatch(zipListing, /test\/popup\.test\.js/);
});
