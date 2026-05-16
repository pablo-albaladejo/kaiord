import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { checkGlossaryShape } from "./check-ux-glossary-shape.mjs";

const WELL_FORMED = `# UX Glossary

## Verbs (one per goal)

| Verb | Use when… | Avoid |
| ---- | --------- | ----- |
| **Create** | Start a new workout | Add |

## Nouns

| Noun | Means |
| ---- | ----- |
| **Workout** | A session |

## State labels (visible to user)

| Label | Means |
| ----- | ----- |
| **Connected** | Online |
`;

describe("checkGlossaryShape", () => {
  describe("happy path", () => {
    it("returns no errors when all required headings and verb row are present", () => {
      const errors = checkGlossaryShape(WELL_FORMED);
      assert.deepEqual(errors, []);
    });
  });

  describe("missing heading", () => {
    it("flags a missing Verbs heading", () => {
      const broken = WELL_FORMED.replace("## Verbs (one per goal)", "## Verbz");
      const errors = checkGlossaryShape(broken);
      assert.ok(
        errors.some((e) => e.includes("Verbs (one per goal)")),
        `expected error mentioning the Verbs heading, got: ${JSON.stringify(errors)}`
      );
    });

    it("flags a missing Nouns heading", () => {
      const broken = WELL_FORMED.replace("## Nouns", "## Substantives");
      const errors = checkGlossaryShape(broken);
      assert.ok(
        errors.some((e) => e.includes("Nouns")),
        `expected error mentioning the Nouns heading, got: ${JSON.stringify(errors)}`
      );
    });

    it("flags a missing State labels heading", () => {
      const broken = WELL_FORMED.replace(
        "## State labels (visible to user)",
        "## States"
      );
      const errors = checkGlossaryShape(broken);
      assert.ok(
        errors.some((e) => e.includes("State labels (visible to user)")),
        `expected error mentioning the State labels heading, got: ${JSON.stringify(errors)}`
      );
    });
  });

  describe("missing canonical verb row", () => {
    it("flags a missing **Create** verb row", () => {
      const broken = WELL_FORMED.replace("**Create**", "**Generate**");
      const errors = checkGlossaryShape(broken);
      assert.ok(
        errors.some((e) => e.includes("Create")),
        `expected error mentioning the Create row, got: ${JSON.stringify(errors)}`
      );
    });
  });

  describe("multiple errors", () => {
    it("returns one error per missing requirement", () => {
      const errors = checkGlossaryShape("# UX Glossary");
      assert.equal(
        errors.length,
        4,
        `expected 4 errors (3 headings + 1 verb row), got: ${JSON.stringify(errors)}`
      );
    });
  });
});
