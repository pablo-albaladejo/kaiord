import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  UMAMI_PLACEHOLDER,
  assembleSite,
  parseAssembleArgs,
} from "./assemble-site.mjs";
import { LEGACY_EDITOR_PAGE } from "./emit-legacy-editor-page.mjs";

const HTML = (body) =>
  `<!DOCTYPE html><html><head><title>x</title></head><body>${body}</body></html>`;

const put = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

describe("assemble-site", () => {
  let root;
  let inputs;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "assemble-site-"));
    inputs = {
      out: join(root, "out"),
      landing: join(root, "landing"),
      app: join(root, "app"),
      docs: join(root, "docs"),
      sha: "abc123",
    };
    put(join(inputs.landing, "index.html"), HTML("landing"));
    put(join(inputs.landing, "404.html"), HTML(UMAMI_PLACEHOLDER));
    put(join(inputs.landing, ".nojekyll"), "");
    put(join(inputs.landing, ".well-known/x.txt"), "top-level dotdir");
    put(join(inputs.landing, ".hidden/x.txt"), "other top-level dotdir");
    put(join(inputs.app, "index.html"), HTML(UMAMI_PLACEHOLDER));
    put(join(inputs.app, ".nojekyll"), "");
    put(join(inputs.app, ".well-known/y.txt"), "app dotdir");
    put(join(inputs.app, "assets/.keep"), "nested dotfile");
    put(join(inputs.docs, "index.html"), HTML("docs"));
    put(join(inputs.docs, ".nojekyll"), "");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("should copy with shell-glob semantics plus the landing .nojekyll and .well-known", () => {
    assembleSite(inputs);

    assert.ok(existsSync(join(inputs.out, ".nojekyll")));
    assert.equal(
      readFileSync(join(inputs.out, ".well-known/x.txt"), "utf8"),
      "top-level dotdir"
    );
    assert.ok(!existsSync(join(inputs.out, ".hidden")));
    assert.ok(!existsSync(join(inputs.out, "app/.well-known")));
    assert.ok(!existsSync(join(inputs.out, "app/.nojekyll")));
    assert.ok(!existsSync(join(inputs.out, "docs/.nojekyll")));
    assert.ok(existsSync(join(inputs.out, "app/assets/.keep")));
    assert.ok(existsSync(join(inputs.out, "docs/index.html")));
  });

  it("should write version.json exactly as the inline printf did", () => {
    assembleSite(inputs);

    assert.equal(
      readFileSync(join(inputs.out, "app/version.json"), "utf8"),
      '{"sha":"abc123"}\n'
    );
  });

  it("should inject the bridge and emit the legacy /editor/ page", () => {
    assembleSite(inputs);

    const fourOhFour = readFileSync(join(inputs.out, "404.html"), "utf8");
    assert.match(fourOhFour, /<head>\n {4}<script>/);
    assert.match(
      readFileSync(join(inputs.out, "app/index.html"), "utf8"),
      /URLSearchParams/
    );
    assert.equal(
      readFileSync(join(inputs.out, "editor/index.html"), "utf8"),
      LEGACY_EDITOR_PAGE
    );
  });

  it("should leave placeholders untouched when no website id is set", () => {
    const { analytics } = assembleSite(inputs);

    assert.equal(analytics, false);
    assert.match(
      readFileSync(join(inputs.out, "404.html"), "utf8"),
      new RegExp(UMAMI_PLACEHOLDER)
    );
  });

  it("should substitute the website id on the merged copies only", () => {
    const { analytics } = assembleSite({ ...inputs, umamiWebsiteId: "w-1" });

    assert.equal(analytics, true);
    for (const file of ["404.html", "app/index.html"]) {
      const html = readFileSync(join(inputs.out, file), "utf8");
      assert.ok(html.includes("w-1"));
      assert.ok(!html.includes(UMAMI_PLACEHOLDER));
    }
    assert.ok(
      readFileSync(join(inputs.app, "index.html"), "utf8").includes(
        UMAMI_PLACEHOLDER
      )
    );
  });

  it("should insert a website id holding replacement patterns verbatim", () => {
    assembleSite({ ...inputs, umamiWebsiteId: "a$&b$'c" });

    assert.ok(
      readFileSync(join(inputs.out, "404.html"), "utf8").includes("a$&b$'c")
    );
  });

  it("should fail when the website id itself reintroduces the placeholder", () => {
    assert.throws(
      () => assembleSite({ ...inputs, umamiWebsiteId: UMAMI_PLACEHOLDER }),
      /still present/
    );
  });

  it("should fail when a substitution target is missing", () => {
    rmSync(join(inputs.landing, "404.html"));

    assert.throws(
      () => assembleSite({ ...inputs, umamiWebsiteId: "w-1" }),
      /Build artifact missing/
    );
  });

  it("should skip docs when docs is null", () => {
    assembleSite({ ...inputs, docs: null });

    assert.ok(!existsSync(join(inputs.out, "docs")));
  });

  it("should fail on a build output holding only dotfiles", () => {
    rmSync(join(inputs.docs, "index.html"));

    assert.throws(() => assembleSite(inputs), /Build output empty/);
  });

  it("should fail on a missing build output", () => {
    assert.throws(
      () => assembleSite({ ...inputs, docs: join(root, "nope") }),
      /Build output missing/
    );
  });
});

describe("parseAssembleArgs", () => {
  const base = ["--out", "o", "--landing", "l", "--app", "a", "--sha", "s"];

  it("should require --docs or --without docs", () => {
    assert.throws(() => parseAssembleArgs(base), /exactly one of/);
  });

  it("should reject --docs together with --without docs", () => {
    assert.throws(
      () => parseAssembleArgs([...base, "--docs", "d", "--without", "docs"]),
      /exactly one of/
    );
  });

  it("should map --without docs to a null docs dir", () => {
    const parsed = parseAssembleArgs([...base, "--without", "docs"]);

    assert.equal(parsed.docs, null);
    assert.equal(parsed.out, resolve("o"));
    assert.equal(parsed.sha, "s");
  });

  it("should require a sha", () => {
    assert.throws(
      () =>
        parseAssembleArgs([
          "--out",
          "o",
          "--landing",
          "l",
          "--app",
          "a",
          "--docs",
          "d",
        ]),
      /Missing --sha/
    );
  });
});
