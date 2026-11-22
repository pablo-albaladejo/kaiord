import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  checkClaimRegisters,
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
      claims: [{ id: "t", text: "Title", kind: "label" }],
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
        { id: "kept", text: "Kept.", kind: "label" },
        { id: "gone", text: "Removed.", kind: "label" },
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
      'claim "skipped": a.test.js has no running test titled "should skip it" (the test is skipped, todo, conditional or excluded by .only)',
    ]);
  });

  it("should not take a title inside a skipped describe, a comment or a string as a running test", () => {
    // Arrange
    const files = {
      [LISTING]: "Skipped.\n\nCommented.\n\nQuoted.\n",
      "a.test.js": [
        'describe.skip("off", () => { it("should be off", () => {}); });',
        '// it("should be commented", () => {});',
        "const s = 'it(\"should be quoted\", () => {})';",
      ].join("\n"),
    };
    const proof = (title) => [{ test: "a.test.js", title }];
    const registers = register({
      surfaces: [{ file: LISTING }],
      claims: [
        { id: "a", text: "Skipped.", proof: proof("should be off") },
        { id: "b", text: "Commented.", proof: proof("should be commented") },
        { id: "c", text: "Quoted.", proof: proof("should be quoted") },
      ],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      'claim "a": a.test.js has no running test titled "should be off" (the test is skipped, todo, conditional or excluded by .only)',
      'claim "b": a.test.js has no running test titled "should be commented" (no test call with that title in code)',
      'claim "c": a.test.js has no running test titled "should be quoted" (no test call with that title in code)',
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
        { id: "public", text: "Public.", kind: "label" },
        { id: "detail", text: "Detail", kind: "label" },
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
      claims: [{ id: "title", text: "Package", kind: "label" }],
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
      claims: [{ id: "public", text: "Public.", kind: "label" }],
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
          kind: "label",
        },
        { id: "b", text: "First item continues.", kind: "label" },
        { id: "c", text: "Second item.", kind: "label" },
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
      claims: [{ id: "d", text: "Does two things.", kind: "label" }],
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
        { id: "h", text: "Your data,", kind: "label" },
        { id: "s", text: "one place", kind: "label" },
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
      claims: [{ id: "t", text: "Kaiord — one place", kind: "label" }],
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
      claims: [{ id: "p", text: "Convert a file.", kind: "label" }],
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
      claims: [{ id: "s", text: "Salud", kind: "label" }],
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
      claims: [{ id: "t", text: "Kaiord — un sitio", kind: "label" }],
    });
    const broken = register({
      surfaces: [{ file: meta, keys: ["es.title", "es.description"] }],
      claims: [{ id: "t", text: "Kaiord — un sitio", kind: "label" }],
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
      claims: [{ id: "one", text: "One.", kind: "label" }],
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
      claims: [{ id, text, kind: "label" }],
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
            { id: "a.t", text: "Alpha.", kind: "label" },
            { id: "a.k", text: "1.", kind: "label" },
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
          claims: [{ id: "e.t", text: "Whole.", kind: "label" }],
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

  it("should refuse only the taken section when a register file names a free one beside it", () => {
    // Arrange
    const files = { [LISTING]: "## A\n\nOne.\n\n## B\n\nTwo.\n" };
    const registers = [
      {
        name: "claims/a.json",
        data: {
          surfaces: [{ file: LISTING, sections: ["A"] }],
          claims: [{ id: "one", text: "One.", kind: "label" }],
        },
      },
      {
        name: "claims/b.json",
        data: {
          surfaces: [{ file: LISTING, sections: ["B", "A"] }],
          claims: [],
        },
      },
    ];

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `claims/b.json: surface ${LISTING} (section "A") is already registered in claims/a.json`,
    ]);
  });

  it("should fail when a short unit appears more often than the register accounts for it", () => {
    // Arrange
    const files = {
      [LISTING]: "Extensions\n\n5\n\nAlso 5\n\n5\n",
      "count.test.js": 'it("should count five", () => {});',
    };
    const proof = [{ test: "count.test.js", title: "should count five" }];
    const once = register({
      surfaces: [{ file: LISTING }],
      claims: [
        { id: "label", text: "Extensions", kind: "label" },
        { id: "also", text: "Also 5", proof },
        { id: "five", text: "5", proof },
      ],
    });
    const counted = register({
      surfaces: [{ file: LISTING }],
      claims: [
        { id: "label", text: "Extensions", kind: "label" },
        { id: "also", text: "Also 5", proof },
        { id: "five", text: "5", proof, count: 2 },
      ],
    });

    // Act
    const problems = [once, counted].map((r) =>
      checkClaims({ registers: r, read: reader(files) })
    );

    // Assert
    assert.deepEqual(problems, [
      [
        'claims/sample.json: "5" appears 2 time(s) on its surfaces but the register accounts for 1; add an entry for each new occurrence (or a count when it is the same claim)',
      ],
      [],
    ]);
  });

  it("should refuse a fact proven only by its own surface, a file existing, an endpoint or a short pin", () => {
    // Arrange
    const files = {
      [LISTING]: "One.\n\nTwo.\n\nThree.\n\nFour.\n\nFive.\n",
      "code.js": "export const LICENSE = 'MIT License';\n",
    };
    const registers = register({
      surfaces: [{ file: LISTING }],
      claims: [
        {
          id: "own",
          text: "One.",
          proof: [{ file: LISTING, contains: "One. is here" }],
        },
        { id: "exists", text: "Two.", proof: [{ file: "code.js" }] },
        {
          id: "endpoint",
          text: "Three.",
          proof: [{ endpoint: "https://example.com/" }],
        },
        {
          id: "short",
          text: "Four.",
          proof: [{ file: "code.js", contains: "MIT License" }],
        },
        {
          id: "pinned",
          text: "Five.",
          proof: [{ file: "code.js", contains: "export const LICENSE = 'MIT" }],
        },
      ],
    });
    files[LISTING] = files[LISTING].replace("One.", "One. is here");
    registers[0].data.claims[0].text = "One. is here";

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(
      problems.map((p) => p.split(":")[0]),
      ['claim "own"', 'claim "exists"', 'claim "endpoint"', 'claim "short"']
    );
    assert.ok(problems.every((p) => p.includes('declare it kind "label"')));
  });

  it("should take a label with no proof, and refuse a label that carries one or an unknown kind", () => {
    // Arrange
    const files = { [LISTING]: "# Title\n\nNext\n\nOdd\n" };
    const registers = register({
      surfaces: [{ file: LISTING }],
      claims: [
        { id: "title", text: "Title", kind: "label" },
        { id: "next", text: "Next", kind: "label", proof: [{ file: LISTING }] },
        { id: "odd", text: "Odd", kind: "slogan" },
      ],
    });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      'claim "next" has unknown field(s) proof',
      'claim "odd": kind "slogan" is none of label, external',
    ]);
  });

  it("should hold an external claim to its url and a reading no older than 180 days", () => {
    // Arrange
    const files = { [LISTING]: "Fresh.\n\nStale.\n\nBare.\n" };
    const url = "https://example.com/terms";
    const registers = register({
      surfaces: [{ file: LISTING }],
      claims: [
        {
          id: "fresh",
          text: "Fresh.",
          kind: "external",
          url,
          read_on: "2026-11-01",
        },
        {
          id: "stale",
          text: "Stale.",
          kind: "external",
          url,
          read_on: "2026-03-01",
        },
        { id: "bare", text: "Bare.", kind: "external" },
      ],
    });
    const today = Date.parse("2026-11-22T12:00:00Z");

    // Act
    const { problems } = checkClaimRegisters({
      registers,
      read: reader(files),
      today,
    });

    // Assert
    assert.deepEqual(problems, [
      `claim "stale": read on 2026-03-01, more than 180 days ago; read ${url} again and update read_on`,
      'claim "bare": an external claim names the https url it read',
      'claim "bare": an external claim has read_on (YYYY-MM-DD)',
    ]);
  });

  it("should hold placeholders, aria descriptions, keywords and the JSON-LD a search engine shows to the register", () => {
    // Arrange
    const page = "page.html";
    const files = {
      [page]: [
        '<meta name="keywords" content="training, health">',
        '<input placeholder="Your key" aria-description="Stays in your browser">',
        '<script type="application/ld+json">{"@type":"WebSite","url":"https://x.test/","name":"Kaiord","description":"A page."}</script>',
      ].join("\n"),
    };
    const registers = register({ surfaces: [{ file: page }], claims: [] });

    // Act
    const problems = checkClaims({ registers, read: reader(files) });

    // Assert
    assert.deepEqual(problems, [
      `${page}: unregistered claim "training, health"`,
      `${page}: unregistered claim "Stays in your browser"`,
      `${page}: unregistered claim "Your key"`,
      `${page}: unregistered claim "Kaiord"`,
      `${page}: unregistered claim "A page."`,
    ]);
  });

  it("should sum up the claims by kind and by proof", () => {
    // Arrange
    const files = {
      [LISTING]: "# Title\n\nTested.\n\nPinned.\n\nRead.\n",
      "a.test.js": 'it("should hold", () => {});',
      "code.js": "export const pinnedLine = true;\n",
    };
    const registers = register({
      surfaces: [{ file: LISTING }],
      claims: [
        { id: "t", text: "Title", kind: "label" },
        {
          id: "a",
          text: "Tested.",
          proof: [{ test: "a.test.js", title: "should hold" }],
        },
        {
          id: "b",
          text: "Pinned.",
          proof: [{ file: "code.js", contains: "export const pinnedLine" }],
        },
        {
          id: "c",
          text: "Read.",
          kind: "external",
          url: "https://x.test/",
          read_on: "2026-11-22",
        },
      ],
    });

    // Act
    const { summary } = checkClaimRegisters({
      registers,
      read: reader(files),
      today: Date.parse("2026-11-22T00:00:00Z"),
    });

    // Assert
    assert.equal(
      summary,
      "4 claims: 1 labels, 1 external, 1 proven by test, 1 by pinned code, 0 unproven"
    );
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
