import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { addReadmeFrontmatter } from "./generate-api-docs.mjs";

const PKG = { name: "core", summary: "domain types" };

function withReadme(body, fn) {
  const dir = mkdtempSync(join(tmpdir(), "api-readme-"));
  try {
    writeFileSync(join(dir, "README.md"), body);
    fn(dir, () => readFileSync(join(dir, "README.md"), "utf8"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("adds a unique title and description to a TypeDoc README", () => {
  withReadme("# @kaiord/core\n", (dir, read) => {
    addReadmeFrontmatter(dir, PKG);

    assert.equal(
      read(),
      [
        "---",
        'title: "@kaiord/core API"',
        'description: "TypeScript API reference for @kaiord/core, domain types."',
        "---",
        "",
        "# @kaiord/core\n",
      ].join("\n")
    );
  });
});

test("is idempotent: a second run leaves the file unchanged", () => {
  withReadme("# @kaiord/core\n", (dir, read) => {
    addReadmeFrontmatter(dir, PKG);
    const once = read();

    addReadmeFrontmatter(dir, PKG);

    assert.equal(read(), once);
  });
});

test("leaves a README that already has frontmatter alone", () => {
  const existing = '---\ntitle: "Custom"\n---\n\n# @kaiord/core\n';
  withReadme(existing, (dir, read) => {
    addReadmeFrontmatter(dir, PKG);

    assert.equal(read(), existing);
  });
});

test("does nothing when TypeDoc wrote no README", () => {
  const dir = mkdtempSync(join(tmpdir(), "api-readme-"));
  try {
    assert.doesNotThrow(() => addReadmeFrontmatter(dir, PKG));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
