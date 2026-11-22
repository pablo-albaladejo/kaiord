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

  it("should hold the title and the lead of a file to the register when its intro is registered", () => {
    // Arrange
    const files = {
      [LISTING]:
        "# Package\n\nThe lead sentence.\n\n## Install\n\nnpm i package\n\n## Features\n\n- One feature.\n",
    };
    const registers = register({
      surfaces: [{ file: LISTING, intro: true, sections: ["Features"] }],
      claims: [{ id: "title", text: "Package", proof: [{ file: LISTING }] }],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `${LISTING}: unregistered claim "The lead sentence."`,
      `${LISTING}: unregistered claim "One feature."`,
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

  it("should hold every text a reader sees on an HTML page to the register, and no script", () => {
    // Arrange
    const page = "page.html";
    const files = {
      [page]:
        '<html><head><script>var hidden = "x";</script><style>p{}</style></head><body><!-- a note --><h1>Your data, <span>one place</span></h1><p>Nothing\n   leaves.</p><p>5</p><p>·</p></body></html>',
    };
    const registers = register({
      surfaces: [{ file: page }],
      claims: [
        { id: "h", text: "Your data,", proof: [{ file: page }] },
        { id: "s", text: "one place", proof: [{ file: page }] },
      ],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `${page}: unregistered claim "Nothing leaves."`,
      `${page}: unregistered claim "5"`,
    ]);
  });

  it("should hold the page title, its descriptions and its text alternatives to the register, entities decoded", () => {
    // Arrange
    const page = "page.html";
    const files = {
      [page]:
        '<html><head><title>Kaiord &mdash; one place</title><meta name="description" content="Calendar &amp; health." /><meta property="og:title" content="Share title" /><meta name="robots" content="index, follow" /><meta property="og:url" content="https://kaiord.com/" /></head><body><div role="img" aria-label="A week of workouts"></div><img alt="Logo" src="x.png" /><a title="Open it">See &rarr;</a></body></html>',
    };
    const registers = register({
      surfaces: [{ file: page }],
      claims: [
        { id: "t", text: "Kaiord — one place", proof: [{ file: page }] },
      ],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `${page}: unregistered claim "Calendar & health."`,
      `${page}: unregistered claim "Share title"`,
      `${page}: unregistered claim "A week of workouts"`,
      `${page}: unregistered claim "Logo"`,
      `${page}: unregistered claim "Open it"`,
      `${page}: unregistered claim "See →"`,
    ]);
  });

  it("should hold a code example on an HTML page to the register as one claim", () => {
    // Arrange
    const page = "page.html";
    const files = {
      [page]:
        '<p>Convert a file.</p><pre class="p-4"><code><span>const</span> <span>krd</span> =\n<span>await</span> fromBinary(file)</code></pre>',
    };
    const registers = register({
      surfaces: [{ file: page }],
      claims: [{ id: "p", text: "Convert a file.", proof: [{ file: page }] }],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `${page}: unregistered claim "const krd = await fromBinary(file)"`,
    ]);
  });

  it("should hold every translation of a JSON translation file to the register, never its source keys", () => {
    // Arrange
    const translations = "es.json";
    const files = {
      [translations]: JSON.stringify({
        "Nothing leaves.": "Nada sale.",
        Health: "Salud",
      }),
    };
    const registers = register({
      surfaces: [{ file: translations }],
      claims: [{ id: "s", text: "Salud", proof: [{ file: translations }] }],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `${translations}: unregistered claim "Nada sale."`,
    ]);
  });

  it("should read the text at each dotted key of a nested JSON file, and fail on one that is missing or empty", () => {
    // Arrange
    const meta = "meta.json";
    const files = {
      [meta]: JSON.stringify({
        es: { lang: "es", title: "Kaiord — un sitio", description: "" },
      }),
    };
    const registers = register({
      surfaces: [{ file: meta, keys: ["es.title"] }],
      claims: [{ id: "t", text: "Kaiord — un sitio", proof: [{ file: meta }] }],
    });
    const broken = register({
      surfaces: [{ file: meta, keys: ["es.title", "es.description"] }],
      claims: [{ id: "t", text: "Kaiord — un sitio", proof: [{ file: meta }] }],
    });

    // Act
    const problems = [registers, broken].map((r) =>
      checkClaims({ registers: r, read: reader(files) })
    );

    // Assert
    assert.deepEqual(problems, [
      [],
      [`${meta}: key(s) es.description missing`],
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

  it("should let two register files own different sections or keys of one file", () => {
    // Arrange
    const locale = "messages.json";
    const files = {
      [LISTING]: "## A\n\nAlpha.\n\n## B\n\nBeta.\n",
      [locale]: JSON.stringify({
        one: { message: "1." },
        two: { message: "2." },
      }),
    };
    const part = (surface, id, text) => ({
      surfaces: [surface],
      claims: [{ id, text, proof: [{ file: surface.file }] }],
    });
    const registers = [
      {
        name: "claims/a.json",
        data: part({ file: LISTING, sections: ["A"] }, "a.t", "Alpha."),
      },
      {
        name: "claims/b.json",
        data: part({ file: LISTING, sections: ["B"] }, "b.t", "Beta."),
      },
      {
        name: "claims/c.json",
        data: part({ file: locale, keys: ["one"] }, "c.t", "1."),
      },
      {
        name: "claims/d.json",
        data: part({ file: locale, keys: ["two"] }, "d.t", "2."),
      },
    ];

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should refuse a section or key another register file holds, and a whole file overlapping one", () => {
    // Arrange
    const locale = "messages.json";
    const files = {
      [LISTING]: "## A\n\nAlpha.\n",
      [locale]: JSON.stringify({ one: { message: "1." } }),
      "whole.md": "Whole.\n",
    };
    const owns = (...surfaces) => ({ surfaces, claims: [] });
    const registers = [
      {
        name: "claims/a.json",
        data: {
          surfaces: [
            { file: LISTING, sections: ["A"] },
            { file: locale, keys: ["one"] },
          ],
          claims: [
            { id: "a.t", text: "Alpha.", proof: [{ file: LISTING }] },
            { id: "a.k", text: "1.", proof: [{ file: locale }] },
          ],
        },
      },
      { name: "claims/b.json", data: owns({ file: LISTING, sections: ["A"] }) },
      { name: "claims/c.json", data: owns({ file: LISTING }) },
      { name: "claims/d.json", data: owns({ file: locale, keys: ["one"] }) },
      {
        name: "claims/e.json",
        data: {
          surfaces: [{ file: "whole.md" }],
          claims: [
            { id: "e.t", text: "Whole.", proof: [{ file: "whole.md" }] },
          ],
        },
      },
      {
        name: "claims/f.json",
        data: owns({ file: "whole.md", sections: ["A"] }),
      },
    ];

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `claims/b.json: surface ${LISTING} (section "A") is already registered in claims/a.json`,
      `claims/c.json: surface ${LISTING} is already registered in claims/a.json`,
      `claims/d.json: surface ${locale} (key "one") is already registered in claims/a.json`,
      "claims/f.json: surface whole.md is already registered in claims/e.json",
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
