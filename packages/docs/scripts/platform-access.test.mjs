import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

// The public register of unofficial access (#1631, ADR 0002): one entry per
// Platform, each saying how Kaiord reaches it, what its terms say and what
// the athlete loses if access is cut off.

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = resolve(docsRoot, "legal/platform-access.md");

const PLATFORMS = ["Garmin", "Train2Go", "Tanita", "TrainingPeaks", "WHOOP"];
const PARTS = [
  "How Kaiord reaches it",
  "What its terms say",
  "What you lose if access is cut off",
];

/** Each `## ` section of the page, by heading, with its `### ` sub-headings. */
const sections = (markdown) => {
  const out = new Map();
  let current = null;
  for (const line of markdown.split("\n")) {
    const h2 = /^## (.+)$/.exec(line);
    if (h2) {
      current = { parts: [] };
      out.set(h2[1].trim(), current);
      continue;
    }
    const h3 = /^### (.+)$/.exec(line);
    if (h3 && current) current.parts.push(h3[1].trim());
  }
  return out;
};

test("should hold one entry per Platform, each with its three parts", () => {
  // Arrange
  const markdown = readFileSync(PAGE, "utf8");

  // Act
  const found = sections(markdown);

  // Assert
  for (const platform of PLATFORMS) {
    assert.ok(found.has(platform), `missing entry: ${platform}`);
    assert.deepEqual(found.get(platform).parts, PARTS, platform);
  }
});

test("should be listed in the Legal sidebar", () => {
  // Arrange
  const config = readFileSync(
    resolve(docsRoot, ".vitepress/config.ts"),
    "utf8"
  );

  // Act
  const listed = config.includes('link: "/legal/platform-access"');

  // Assert
  assert.equal(listed, true);
});
