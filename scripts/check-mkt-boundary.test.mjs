import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { ALLOWLIST, MARKETING_PATHS, runCheck } from "./check-mkt-boundary.mjs";

const withTree = (files, run) => {
  const root = mkdtempSync(join(tmpdir(), "mkt-boundary-"));
  try {
    for (const [rel, content] of Object.entries(files)) {
      const full = join(root, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
    run(runCheck({ srcRoot: root }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test("(a) the real repo has no violation", () => {
  assert.deepEqual(runCheck(), []);
});

test("(b) a product component referencing --mkt-brand fails", () => {
  withTree(
    {
      "packages/workout-spa-editor/src/Header.tsx":
        'const s = "text-[var(--mkt-brand)]";\n',
    },
    (found) => {
      assert.equal(found.length, 1);
      assert.equal(found[0].rule, "R-MktBoundary");
      assert.equal(found[0].detail, "--mkt-brand");
      assert.equal(found[0].line, 1);
    }
  );
});

test("(c) the landing page may reference it", () => {
  withTree(
    { "packages/landing/index.html": '<a class="bg-[var(--mkt-cta)]">x</a>\n' },
    (found) => assert.deepEqual(found, [])
  );
});

test("(d) the Open Graph card renderer may reference it", () => {
  withTree(
    { "scripts/brand-og-card.mjs": 'readBrandTokenColor("--mkt-brand");\n' },
    (found) => assert.deepEqual(found, [])
  );
});

test("(e) the token file that declares them may reference it", () => {
  withTree(
    { "styles/brand-tokens.css": ":root { --mkt-brand: var(--mg-700); }\n" },
    (found) => assert.deepEqual(found, [])
  );
});

test("(f) a CSS file under the editor fails too, not just TSX", () => {
  withTree(
    {
      "packages/workout-spa-editor/src/index.css":
        ":root {\n  --accent: var(--mkt-cta);\n}\n",
    },
    (found) => {
      assert.equal(found.length, 1);
      assert.equal(found[0].line, 2);
    }
  );
});

test("(g) an SVG asset baking the token in fails", () => {
  withTree(
    { "assets/mark.svg": '<circle fill="var(--mkt-brand)"/>\n' },
    (found) => assert.equal(found.length, 1)
  );
});

test("(h) --core-live is not a marketing token and passes", () => {
  withTree(
    { "packages/workout-spa-editor/src/Mark.tsx": 'fill="var(--core-live)"\n' },
    (found) => assert.deepEqual(found, [])
  );
});

test("(i) a directory whose name merely starts with the landing prefix is not exempt", () => {
  withTree(
    { "packages/landing-clone/index.html": "var(--mkt-cta)\n" },
    (found) => assert.equal(found.length, 1)
  );
});

test("(j) a scripts/ suite may name the token, but a scripts/ tool may not", () => {
  withTree(
    {
      "scripts/whatever.test.mjs": 'readBrandTokenColor("--mkt-brand");\n',
      "scripts/whatever.mjs": 'const c = "var(--mkt-brand)";\n',
    },
    (found) => {
      assert.deepEqual(
        found.map((v) => v.file),
        ["scripts/whatever.mjs"]
      );
    }
  );
});

test("(k) node_modules and dist are skipped", () => {
  withTree(
    {
      "packages/x/node_modules/lib/a.css": "var(--mkt-brand)\n",
      "packages/x/dist/b.css": "var(--mkt-brand)\n",
    },
    (found) => assert.deepEqual(found, [])
  );
});

test("ALLOWLIST ships empty", () => {
  assert.equal(ALLOWLIST.size, 0);
});

test("MARKETING_PATHS is exactly the landing, the card and the token file", () => {
  assert.deepEqual([...MARKETING_PATHS].sort(), [
    "packages/landing/",
    "scripts/brand-og-card.mjs",
    "styles/brand-tokens.css",
  ]);
});

test("(l) a file that merely extends an approved file's name is not exempt", () => {
  withTree(
    {
      "scripts/brand-og-card.mjs.ts": 'const c = "var(--mkt-brand)";\n',
      "styles/brand-tokens.css.bak": ":root { --mkt-brand: red; }\n",
    },
    (found) => {
      assert.deepEqual(
        found.map((v) => v.file),
        ["scripts/brand-og-card.mjs.ts"]
      );
    }
  );
});

test("(m) .vitepress source is scanned, not skipped as tooling noise", () => {
  withTree(
    {
      "packages/docs/.vitepress/theme/custom.css":
        ":root {\n  --vp-c-brand-1: var(--mkt-brand);\n}\n",
    },
    (found) => {
      assert.deepEqual(
        found.map((v) => v.file),
        ["packages/docs/.vitepress/theme/custom.css"]
      );
    }
  );
});
