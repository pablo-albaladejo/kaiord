import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { applyBranch, unionLines } from "./union-timeseries.mjs";

const row = (date, extra = {}) =>
  JSON.stringify({ date, source: "gsc", ...extra });

// A fake `git` that serves one ref's tree from a { path: content } map.
const fakeGit = (ref, tree) => (args) => {
  if (args[0] === "ls-tree") {
    const dir = args.at(-1);
    return Object.keys(tree)
      .filter((p) => p.startsWith(dir))
      .join("\n");
  }
  if (args[0] === "show") {
    const [gotRef, path] = args[1].split(/:(.*)/s);
    assert.equal(gotRef, ref);
    if (!(path in tree))
      throw new Error(`fatal: path '${path}' does not exist`);
    return tree[path];
  }
  throw new Error(`unexpected git ${args.join(" ")}`);
};

const silent = { warn: () => {} };

const withRoot = (files, fn) => {
  const root = mkdtempSync(join(tmpdir(), "union-"));
  try {
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), content);
    }
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

describe("unionLines", () => {
  it("should keep a line that exists only on main", () => {
    // Arrange
    const mainOnly = row("2026-08-10");

    // Act
    const { lines } = unionLines([mainOnly], [row("2026-09-21")]);

    // Assert
    assert.ok(lines.includes(mainOnly));
  });

  it("should keep a line that exists only on the branch", () => {
    // Arrange
    const branchOnly = row("2026-09-21");

    // Act
    const { lines } = unionLines([row("2026-08-10")], [branchOnly]);

    // Assert
    assert.ok(lines.includes(branchOnly));
  });

  it("should keep an identical line once", () => {
    // Arrange
    const shared = row("2026-08-10");

    // Act
    const { lines } = unionLines([shared], [shared, row("2026-09-21")]);

    // Assert
    assert.equal(lines.filter((l) => l === shared).length, 1);
    assert.equal(lines.length, 2);
  });

  it("should sort by date and keep first appearance for equal dates", () => {
    // Arrange
    const a = row("2026-09-07", { provider: "a" });
    const b = row("2026-09-07", { provider: "b" });
    const early = row("2026-07-22");

    // Act
    const { lines } = unionLines([a, row("2026-09-14")], [early, b]);

    // Assert
    assert.deepEqual(lines, [early, a, b, row("2026-09-14")]);
  });

  it("should keep a malformed line verbatim at the end and report it", () => {
    // Arrange
    const broken = '{"date":"2026-09-07",';

    // Act
    const { lines, malformed } = unionLines([broken, row("2026-09-07")], []);

    // Assert
    assert.deepEqual(lines, [row("2026-09-07"), broken]);
    assert.deepEqual(malformed, [broken]);
  });
});

describe("applyBranch", () => {
  const SERIES = "reports/seo/timeseries/gsc.jsonl";
  const SNAP = "reports/seo/snapshots";

  it("should merge the branch week into main without dropping main's lines", () => {
    // Arrange
    const mainOnly = row("2026-08-10");
    const shared = row("2026-07-22");
    const branchOnly = row("2026-09-21");
    const git = fakeGit("origin/auto/x", {
      [SERIES]: `${shared}\n${branchOnly}\n`,
    });

    withRoot({ [SERIES]: `${shared}\n${mainOnly}\n` }, (root) => {
      // Act
      applyBranch({ ref: "origin/auto/x", root, git, log: silent });

      // Assert
      const merged = readFileSync(join(root, SERIES), "utf8");
      assert.equal(merged, `${shared}\n${mainOnly}\n${branchOnly}\n`);
    });
  });

  it("should create a series file that exists only on the branch", () => {
    // Arrange
    const git = fakeGit("r", { [SERIES]: `${row("2026-09-21")}\n` });

    withRoot({}, (root) => {
      // Act
      applyBranch({ ref: "r", root, git, log: silent });

      // Assert
      assert.equal(
        readFileSync(join(root, SERIES), "utf8"),
        `${row("2026-09-21")}\n`
      );
    });
  });

  it("should copy snapshots missing on main and never overwrite existing ones", () => {
    // Arrange
    const git = fakeGit("r", {
      [SERIES]: `${row("2026-09-21")}\n`,
      [`${SNAP}/gsc-2026-09-21.json`]: '{"from":"branch"}\n',
      [`${SNAP}/gsc-2026-08-10.json`]: '{"from":"branch"}\n',
    });

    withRoot(
      { [`${SNAP}/gsc-2026-08-10.json`]: '{"from":"main"}\n' },
      (root) => {
        // Act
        const report = applyBranch({ ref: "r", root, git, log: silent });

        // Assert
        assert.equal(
          readFileSync(join(root, SNAP, "gsc-2026-08-10.json"), "utf8"),
          '{"from":"main"}\n'
        );
        assert.equal(
          readFileSync(join(root, SNAP, "gsc-2026-09-21.json"), "utf8"),
          '{"from":"branch"}\n'
        );
        assert.deepEqual(report.snapshotsCopied, [
          `${SNAP}/gsc-2026-09-21.json`,
        ]);
      }
    );
  });

  it("should warn about a malformed line it keeps", () => {
    // Arrange
    const warnings = [];
    const git = fakeGit("r", { [SERIES]: "not json\n" });

    withRoot({}, (root) => {
      // Act
      applyBranch({
        ref: "r",
        root,
        git,
        log: { warn: (m) => warnings.push(m) },
      });

      // Assert
      assert.equal(readFileSync(join(root, SERIES), "utf8"), "not json\n");
      assert.equal(warnings.length, 1);
      assert.match(
        warnings[0],
        /^::warning file=reports\/seo\/timeseries\/gsc\.jsonl::/
      );
    });
  });

  it("should throw on a ref without any timeseries file", () => {
    // Arrange
    const git = fakeGit("r", { "README.md": "x" });

    withRoot({}, (root) => {
      // Act + Assert
      assert.throws(
        () => applyBranch({ ref: "r", root, git, log: silent }),
        /has no reports\/seo\/timeseries\/\*\.jsonl/
      );
    });
  });
});
