import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { ALLOWLIST, runCheck } from "./check-no-raw-chromatic.mjs";

const withTree = (files, run) => {
  const root = mkdtempSync(join(tmpdir(), "no-raw-chromatic-"));
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

test("(a) the real SPA has no raw chromatic utility", () => {
  assert.deepEqual(runCheck(), []);
});

test("(b) allowlist ships empty", () => {
  assert.equal(ALLOWLIST.size, 0);
});

test("(c) flags every retired family, not just the loud ones", () => {
  withTree(
    {
      "components/A.tsx": [
        'const a = "bg-red-600";',
        'const b = "text-amber-400";',
        'const c = "border-emerald-200";',
        'const d = "ring-sky-500";',
        'const e = "placeholder-rose-300";',
        "",
      ].join("\n"),
    },
    (found) => {
      assert.deepEqual(found.map((v) => v.detail).sort(), [
        "bg-red-600",
        "border-emerald-200",
        "placeholder-rose-300",
        "ring-sky-500",
        "text-amber-400",
      ]);
      assert.ok(found.every((v) => v.rule === "R-NoRawChromatic"));
    }
  );
});

test("(d) sees through a variant chain", () => {
  withTree(
    {
      "components/B.tsx":
        'const a = "dark:hover:bg-yellow-900/20 md:focus-visible:ring-indigo-500";\n',
    },
    (found) => {
      assert.equal(found.length, 2);
    }
  );
});

test("(e) leaves the neutral families alone", () => {
  withTree(
    {
      "components/C.tsx":
        'const a = "bg-gray-100 text-slate-700 border-zinc-200 bg-neutral-50 text-stone-600";\n',
    },
    (found) => assert.deepEqual(found, [])
  );
});

test("(f) leaves roles alone — they carry no family name", () => {
  withTree(
    {
      "components/D.tsx":
        'const a = "bg-zone-3/15 text-danger-text border-danger-border bg-action text-ink-strong";\n',
    },
    (found) => assert.deepEqual(found, [])
  );
});

test("(g) a comment may name a retired hue, because the reasoning has to survive", () => {
  withTree(
    {
      "components/E.tsx": [
        "/* The user bubble was `bg-sky-600`, five degrees off --zone-2. */",
        "// bg-amber-100 was the old warning surface.",
        'const a = "bg-surface-elevated";',
        "",
      ].join("\n"),
    },
    (found) => assert.deepEqual(found, [])
  );
});

test("(h) still flags a hue on a line that merely starts with code", () => {
  // The comment exemption is per-line and anchored: a trailing comment must
  // not launder the utility sitting before it.
  withTree(
    {
      "components/F.tsx": 'const a = "bg-red-600"; // retired, honest\n',
    },
    (found) => {
      assert.equal(found.length, 1);
      assert.equal(found[0].detail, "bg-red-600");
    }
  );
});
