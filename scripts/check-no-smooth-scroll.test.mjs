import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { ALLOWLIST, runCheck } from "./check-no-smooth-scroll.mjs";

const withTree = (files, run) => {
  const root = mkdtempSync(join(tmpdir(), "no-smooth-scroll-"));
  try {
    for (const [rel, content] of Object.entries(files)) {
      const full = join(root, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content, "utf8");
    }
    run(runCheck({ srcRoot: root }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test("(a) the real SPA sets no default smooth scrolling", () => {
  assert.deepEqual(runCheck(), []);
});

test("(b) allowlist ships empty", () => {
  assert.equal(ALLOWLIST.size, 0);
});

test("(c) flags a smooth scroll-behavior in CSS, on any selector", () => {
  withTree(
    {
      "index.css": "html {\n  scroll-behavior: smooth;\n}\n",
      "panel.css": ".list{scroll-behavior:smooth}\n",
      "applied.css": ".list {\n  @apply overflow-auto scroll-smooth;\n}\n",
    },
    (found) => {
      assert.equal(found.length, 3);
      assert.ok(found.every((v) => v.rule === "R-NoGlobalSmoothScroll"));
    }
  );
});

test("(d) flags the scroll-smooth utility and a smooth style object", () => {
  withTree(
    {
      "components/A.tsx": '<div className="overflow-y-auto scroll-smooth" />\n',
      "components/B.tsx": 'const s = { scrollBehavior: "smooth" };\n',
      "lib/c.ts": "const cls = `md:scroll-smooth`;\n",
    },
    (found) => {
      assert.deepEqual(found.map((v) => v.file.split("/").pop()).sort(), [
        "A.tsx",
        "B.tsx",
        "c.ts",
      ]);
    }
  );
});

test("(e) leaves per-call glides, auto behaviour and comments alone", () => {
  withTree(
    {
      "hooks/glide.ts":
        'el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });\n',
      "index.css":
        "/* scroll-behavior: smooth used to live here */\nhtml { scroll-behavior: auto; }\n",
      "components/C.tsx": "// the old scroll-smooth class\nconst a = 1;\n",
    },
    (found) => assert.deepEqual(found, [])
  );
});
