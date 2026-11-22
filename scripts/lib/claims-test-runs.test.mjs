import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { testRunProblem } from "./claims-test-runs.mjs";

const TITLE = "should prove it";

const CASES = {
  "a describe.skip around it": `describe.skip("s", () => { it("${TITLE}", () => {}); });`,
  "a nested describe.skip around it": `describe("a", () => { describe.skip("b", () => { it("${TITLE}", () => {}); }); });`,
  "an it.skip": `it.skip("${TITLE}", () => {});`,
  "an it.todo": `it.todo("${TITLE}");`,
  "an xit": `xit("${TITLE}", () => {});`,
  "a conditional skip": `it.skipIf(process.env.CI)("${TITLE}", () => {});`,
  "a skip option": `it("${TITLE}", { skip: true }, () => {});`,
  "a describe.todo": `describe.todo("s", () => { it("${TITLE}", () => {}); });`,
  "a line comment": `// it("${TITLE}", () => {});`,
  "a block comment": `/*\n it("${TITLE}", () => {});\n*/`,
  "a string": `const s = 'it("${TITLE}", () => {})';`,
  "a template": "const s = `it('" + TITLE + "')`;",
  "an .only elsewhere in the file": `it.only("other", () => {}); it("${TITLE}", () => {});`,
  "a describe.only elsewhere": `describe.only("o", () => {}); describe("s", () => { it("${TITLE}", () => {}); });`,
};

describe("claims-test-runs", () => {
  for (const [name, src] of Object.entries(CASES)) {
    it(`should not count a test behind ${name}`, () => {
      // Arrange
      const file = src;

      // Act
      const problem = testRunProblem(file, TITLE);

      // Assert
      assert.equal(typeof problem, "string");
    });
  }

  it("should count a running test in a running describe, with either quote", () => {
    // Arrange
    const files = [
      `describe("s", () => { it("${TITLE}", () => {}); });`,
      `test('${TITLE}', async () => { expect(/\\)/.test("(")).toBe(false); });`,
      `describe.only("s", () => { it(\`${TITLE}\`, () => {}); });`,
      `it(\n  "${TITLE}",\n  () => {}\n);`,
    ];

    // Act
    const problems = files.map((f) => testRunProblem(f, TITLE));

    // Assert
    assert.deepEqual(problems, [null, null, null, null]);
  });
});
