import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  checkClaims,
  fsReader,
  loadRegisters,
  repoReader,
} from "./check-claims.mjs";

const reader = (files) => (path) => files[path] ?? null;

const register = (data) => [{ name: "claims/sample.json", data }];

const LISTING = "listing.md";

describe("check-claims", () => {
  it("should fail on a sentence in a registered surface with no register entry", () => {
    // Arrange
    const files = {
      [LISTING]: "# Title\n\nTokens never leave your browser.\n",
    };
    const registers = register({
      surfaces: [{ file: LISTING }],
      claims: [{ id: "t", text: "Title", proof: [{ file: LISTING }] }],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `${LISTING}: unregistered claim "Tokens never leave your browser."`,
    ]);
  });

  it("should fail on a register entry whose text is no longer on its surface", () => {
    // Arrange
    const files = { [LISTING]: "Kept.\n" };
    const registers = register({
      surfaces: [{ file: LISTING }],
      claims: [
        { id: "kept", text: "Kept.", proof: [{ file: LISTING }] },
        { id: "gone", text: "Removed.", proof: [{ file: LISTING }] },
      ],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      'claims/sample.json: claim "gone" is on none of its surfaces; delete the entry',
    ]);
  });

  it("should fail when a claim's proof file no longer exists", () => {
    // Arrange
    const files = { [LISTING]: "Kept.\n" };
    const registers = register({
      surfaces: [{ file: LISTING }],
      claims: [{ id: "kept", text: "Kept.", proof: [{ file: "gone.js" }] }],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      'claim "kept": proof file gone.js does not exist',
    ]);
  });

  it("should fail when a proof file no longer holds the code it points to", () => {
    // Arrange
    const files = { [LISTING]: "Kept.\n", "a.js": "const b = 2;\n" };
    const registers = register({
      surfaces: [{ file: LISTING }],
      claims: [
        {
          id: "kept",
          text: "Kept.",
          proof: [{ file: "a.js", contains: "const a = 1;" }],
        },
      ],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      'claim "kept": a.js no longer contains "const a = 1;"',
    ]);
  });

  it("should accept a test proof only while that test exists and is not skipped", () => {
    // Arrange
    const files = {
      [LISTING]: "Kept.\n\nSkipped.\n",
      "a.test.js":
        'it("should keep it", () => {});\nit.skip("should skip it", () => {});\n',
    };
    const registers = register({
      surfaces: [{ file: LISTING }],
      claims: [
        {
          id: "kept",
          text: "Kept.",
          proof: [{ test: "a.test.js", title: "should keep it" }],
        },
        {
          id: "skipped",
          text: "Skipped.",
          proof: [{ test: "a.test.js", title: "should skip it" }],
        },
      ],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      'claim "skipped": a.test.js has no running test titled "should skip it"',
    ]);
  });

  it("should hold only the registered sections of a file to the register", () => {
    // Arrange
    const files = {
      [LISTING]:
        "## Internal\n\nNot public.\n\n## Description\n\nPublic.\n\n### Detail\n\nAlso public.\n\n## Checklist\n\n- Not public either.\n",
    };
    const registers = register({
      surfaces: [{ file: LISTING, sections: ["Description"] }],
      claims: [
        { id: "public", text: "Public.", proof: [{ file: LISTING }] },
        { id: "detail", text: "Detail", proof: [{ file: LISTING }] },
      ],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `${LISTING}: unregistered claim "Also public."`,
    ]);
  });

  it("should fail when a registered section is missing rather than pass on no text", () => {
    // Arrange
    const files = { [LISTING]: "## Renamed\n\nPublic.\n" };
    const registers = register({
      surfaces: [{ file: LISTING, sections: ["Description"] }],
      claims: [{ id: "public", text: "Public.", proof: [{ file: LISTING }] }],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `${LISTING}: section "Description" is missing`,
    ]);
  });

  it("should match a claim however its paragraph is wrapped, and each list item on its own", () => {
    // Arrange
    const files = {
      [LISTING]:
        "<!-- a note -->\nOne sentence\nwrapped here.\n\n- First item\n  continues.\n- Second item.\n",
    };
    const registers = register({
      surfaces: [{ file: LISTING }],
      claims: [
        {
          id: "a",
          text: "One sentence wrapped here.",
          proof: [{ file: LISTING }],
        },
        { id: "b", text: "First item continues.", proof: [{ file: LISTING }] },
        { id: "c", text: "Second item.", proof: [{ file: LISTING }] },
      ],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should read the messages of the named keys of a locale file", () => {
    // Arrange
    const locale = "messages.json";
    const files = {
      [locale]: JSON.stringify({
        extName: { message: "Name" },
        extDescription: { message: "Does one thing." },
      }),
    };
    const registers = register({
      surfaces: [{ file: locale, keys: ["extDescription"] }],
      claims: [
        { id: "d", text: "Does two things.", proof: [{ file: locale }] },
      ],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `${locale}: unregistered claim "Does one thing."`,
      'claims/sample.json: claim "d" is on none of its surfaces; delete the entry',
    ]);
  });

  it("should refuse a claim with no proof and a proof field it does not know", () => {
    // Arrange
    const files = { [LISTING]: "One.\n\nTwo.\n" };
    const registers = register({
      surfaces: [{ file: LISTING }],
      claims: [
        { id: "one", text: "One.", proof: [] },
        { id: "two", text: "Two.", proof: [{ file: LISTING, contain: "x" }] },
      ],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      'claim "one": has no proof',
      `claim "two": proof {"file":"${LISTING}","contain":"x"} has unknown field(s) contain`,
    ]);
  });

  it("should refuse the same claim id or the same surface in two register files", () => {
    // Arrange
    const files = { [LISTING]: "One.\n" };
    const data = {
      surfaces: [{ file: LISTING }],
      claims: [{ id: "one", text: "One.", proof: [{ file: LISTING }] }],
    };
    const registers = [
      { name: "claims/a.json", data },
      { name: "claims/b.json", data },
    ];

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `claims/b.json: surface ${LISTING} is already registered in claims/a.json`,
      'claims/b.json: claim id "one" is already used in claims/a.json',
    ]);
  });

  it("should let two register files hold different sections of one file", () => {
    // Arrange
    const files = { [LISTING]: "## A\n\nAlpha.\n\n## B\n\nBeta.\n" };
    const registers = [
      {
        name: "claims/a.json",
        data: {
          surfaces: [{ file: LISTING, sections: ["A"] }],
          claims: [{ id: "a.t", text: "Alpha.", proof: [{ file: LISTING }] }],
        },
      },
      {
        name: "claims/b.json",
        data: {
          surfaces: [{ file: LISTING, sections: ["B"] }],
          claims: [{ id: "b.t", text: "Beta.", proof: [{ file: LISTING }] }],
        },
      },
    ];

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should refuse a section another register file already holds, or the whole file", () => {
    // Arrange
    const files = { [LISTING]: "## A\n\nAlpha.\n" };
    const claims = [{ id: "t", text: "Alpha.", proof: [{ file: LISTING }] }];
    const registers = [
      {
        name: "claims/a.json",
        data: { surfaces: [{ file: LISTING, sections: ["A"] }], claims },
      },
      {
        name: "claims/b.json",
        data: { surfaces: [{ file: LISTING, sections: ["A"] }], claims: [] },
      },
      {
        name: "claims/c.json",
        data: { surfaces: [{ file: LISTING }], claims: [] },
      },
    ];

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `claims/b.json: surface ${LISTING} (section "A") is already registered in claims/a.json`,
      `claims/c.json: surface ${LISTING} is already registered in claims/a.json`,
    ]);
  });

  it("should pass on the register and surfaces the repo ships", () => {
    // Arrange
    const registers = loadRegisters();

    // Act
    const problems = checkClaims({ registers, read: repoReader });

    // Assert
    assert.ok(registers.length > 0);
    assert.deepEqual(problems, []);
  });

  it("should read no proof outside the repository", () => {
    // Arrange
    const read = fsReader(process.cwd());

    // Act
    const outside = [read("../package.json"), read("/etc/hosts")];

    // Assert
    assert.deepEqual(outside, [null, null]);
  });
});
