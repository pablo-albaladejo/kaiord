import { test } from "node:test";
import assert from "node:assert/strict";

import {
  classifyShard,
  findTitleViolators,
  isAaaViolator,
} from "./bootstrap-test-conventions-allowlists.mjs";

test("findTitleViolators flags non-should titles", () => {
  // Arrange
  const source = `
    it("renders the calendar", () => {});
    it("should compute correctly", () => {});
    it("returns null", () => {});
  `;

  // Act
  const violators = findTitleViolators(source);

  // Assert — only the two non-should titles
  assert.equal(violators.length, 2);
  assert.equal(violators[0].title, "renders the calendar");
  assert.equal(violators[1].title, "returns null");
});

test("findTitleViolators tracks line numbers", () => {
  // Arrange
  const source = ['describe("X", () => {', '  it("renders", () => {});', "});"].join("\n");

  // Act
  const violators = findTitleViolators(source);

  // Assert — `it("renders"...)` is on line 2
  assert.equal(violators.length, 1);
  assert.equal(violators[0].line, 2);
});

test("findTitleViolators ignores already-conformant should-prefixed titles", () => {
  // Arrange
  const source = `
    it("should render correctly", () => {});
    it("should return null on empty input", () => {});
    it.each([1, 2])("should compute for %s", v => {});
  `;

  // Act
  const violators = findTitleViolators(source);

  // Assert
  assert.equal(violators.length, 0);
});

test("findTitleViolators flags it.skip / it.only / it.todo / it.fails non-should titles", () => {
  // Arrange
  const source = `
    it.skip("renders X", () => {});
    it.only("returns Y", () => {});
    it.todo("handles edge case");
    it.fails("throws on bad input", () => {});
  `;

  // Act
  const violators = findTitleViolators(source);

  // Assert
  assert.equal(violators.length, 4);
});

test("isAaaViolator returns false when file has no it() calls", () => {
  // Arrange
  const source = `describe("X", () => { /* no its */ });`;

  // Act
  const isViolator = isAaaViolator(source);

  // Assert
  assert.equal(isViolator, false);
});

test("isAaaViolator returns true when it() count exceeds Arrange marker count", () => {
  // Arrange
  const source = `
    it("should X", () => {
      // Arrange
      const x = 1;

      // Act
      const y = x + 1;

      // Assert
      expect(y).toBe(2);
    });
    it("should Y", () => {
      // No AAA markers here
      expect(true).toBe(true);
    });
  `;

  // Act
  const isViolator = isAaaViolator(source);

  // Assert — 2 it() calls, 1 Arrange marker → violator
  assert.equal(isViolator, true);
});

test("isAaaViolator returns false when every it() has a canonical Arrange marker", () => {
  // Arrange
  const source = `
    it("should X", () => {
      // Arrange
      const x = 1;
      // Act
      const y = x;
      // Assert
      expect(y).toBe(1);
    });
    it("should Y", () => {
      // Arrange
      // Act
      // Assert
      expect(true).toBe(true);
    });
  `;

  // Act
  const isViolator = isAaaViolator(source);

  // Assert
  assert.equal(isViolator, false);
});

test("isAaaViolator counts lowercase variants as missing canonical markers", () => {
  // Arrange — `// arrange` (lowercase) does NOT match canonical regex
  const source = `
    it("should X", () => {
      // arrange
      // act
      // assert
      expect(true).toBe(true);
    });
  `;

  // Act
  const isViolator = isAaaViolator(source);

  // Assert — 1 it(), 0 canonical Pascal-case Arrange markers → violator
  assert.equal(isViolator, true);
});

test("classifyShard partitions backend / SPA-non-component / SPA-component", () => {
  // Arrange / Act / Assert
  assert.equal(classifyShard("packages/core/src/x.test.ts"), "BACKEND");
  assert.equal(classifyShard("packages/fit/src/y.test.ts"), "BACKEND");
  assert.equal(classifyShard("packages/cli/src/z.test.ts"), "BACKEND");
  assert.equal(
    classifyShard("packages/workout-spa-editor/src/application/x.test.ts"),
    "SPA_NON_COMPONENT"
  );
  assert.equal(
    classifyShard("packages/workout-spa-editor/src/store/y.test.ts"),
    "SPA_NON_COMPONENT"
  );
  assert.equal(
    classifyShard(
      "packages/workout-spa-editor/src/components/Foo/Foo.test.tsx"
    ),
    "SPA_COMPONENT"
  );
  assert.equal(
    classifyShard("packages/workout-spa-editor/src/App.test.tsx"),
    "SPA_COMPONENT"
  );
});
