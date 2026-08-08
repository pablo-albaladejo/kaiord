import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { BRAND_TOKENS_PATH } from "./brand-tokens.mjs";
import { FROZEN_MIRRORS, runCheck } from "./check-frozen-hex-parity.mjs";

const withTree = (files, run) => {
  const root = mkdtempSync(join(tmpdir(), "frozen-hex-"));
  try {
    for (const [rel, content] of Object.entries(files)) {
      const full = join(root, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
    run(runCheck({ srcRoot: root, tokensPath: BRAND_TOKENS_PATH }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const FIRST = FROZEN_MIRRORS[0];

test("(a) the real repo's frozen mirrors match their roles", () => {
  assert.deepEqual(runCheck(), []);
});

test("(b) a hex that no longer matches its role fails", () => {
  withTree(
    { [FIRST.file]: `const ${FIRST.constant} = "#123456";\n` },
    (found) => {
      assert.equal(found.length >= 1, true);
      assert.equal(found[0].rule, "R-FrozenHexParity");
      assert.match(found[0].detail, /froze #123456/);
    }
  );
});

test("(c) a constant that stopped being a hex literal fails", () => {
  withTree(
    { [FIRST.file]: `const ${FIRST.constant} = someRuntimeLookup();\n` },
    (found) => {
      const own = found.filter((v) => v.detail.includes(FIRST.constant));
      assert.equal(own.length, 1);
      assert.match(own[0].detail, /no longer a hex literal/);
    }
  );
});

test("(d) a mirror whose file disappeared fails instead of passing silently", () => {
  withTree({}, (found) => {
    assert.equal(found.length, FROZEN_MIRRORS.length);
    assert.match(found[0].detail, /missing file/);
  });
});

test("(e) a decoy constant sharing the name's tail cannot satisfy the guard", () => {
  // The real constant stopped being a literal; a look-alike still holds a
  // matching hex. An unanchored match would read the decoy and pass.
  withTree(
    {
      [FIRST.file]: [
        `const OLD_${FIRST.constant} = "#f0f0f0";`,
        `const ${FIRST.constant} = readThemeColor("--bg-elevated");`,
        "",
      ].join("\n"),
    },
    (found) => {
      // Assert about THIS constant: canvas-setup carries a second mirror, so
      // `found[0]` alone is satisfied by the other one's violation and the
      // case would pass with the unanchored regex it exists to reject.
      const own = found.filter((v) => v.detail.includes(FIRST.constant));
      assert.equal(own.length, 1);
      assert.match(own[0].detail, /no longer a hex literal/);
    }
  );
});

test("(f) a hex inside a comment mentioning the constant does not satisfy it", () => {
  withTree(
    {
      [FIRST.file]: [
        `// ${FIRST.constant} = "#f0f0f0" was the old value`,
        `const ${FIRST.constant} = someLookup();`,
        "",
      ].join("\n"),
    },
    (found) => {
      const own = found.filter((v) => v.detail.includes(FIRST.constant));
      assert.equal(own.length, 1);
      assert.match(own[0].detail, /no longer a hex literal/);
    }
  );
});
