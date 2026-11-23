import assert from "node:assert/strict";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  athleteTexts,
  checkConnectionNotices,
  literalsOf,
  loadMaster,
  MASTER,
  masterProblems,
  phrasingProblems,
  popupProblems,
  staleAllowed,
} from "./check-connection-notices.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DICT = "packages/workout-spa-editor/src/i18n/locales/en/editor.json#x";

const clone = (api, edit) => {
  const copy = JSON.parse(JSON.stringify({ ...api, noticeFor: undefined }));
  edit(copy);
  return copy;
};

describe("check-connection-notices", () => {
  it("should pass on the repository as it stands", () => {
    // Arrange
    const root = ROOT;

    // Act
    const problems = checkConnectionNotices(root);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should read athlete text from the App and from all five extensions", () => {
    // Arrange
    const root = ROOT;

    // Act
    const wheres = athleteTexts(root).map(({ where }) => where);

    // Assert
    for (const surface of [
      "src/i18n/locales/en/",
      "src/i18n/locales/es/",
      "src/components/",
      "garmin-bridge/popup.js",
      "train2go-bridge/_locales/en/messages.json",
      "whoop-bridge/popup.js",
      "tanita-bridge/popup.js",
      "trainingpeaks-bridge/_locales/en/messages.json",
    ]) {
      assert.ok(
        wheres.some((where) => where.includes(surface)),
        `read nothing from ${surface}`
      );
    }
  });

  it("should fail on a fifth fix in the single source", () => {
    // Arrange
    const api = clone(loadMaster(), (copy) => {
      copy.FIXES = [...copy.FIXES, "reload"];
      copy.FIX_FOR_STATE.stale = "reload";
      copy.WORDING.en.reload = {
        message: "{platform} changed.",
        action: "Reload",
      };
    });

    // Act
    const problems = masterProblems(api);

    // Assert
    assert.ok(problems.some((p) => p.includes("FIXES is")));
    assert.ok(problems.some((p) => p.includes("FIX_FOR_STATE")));
    assert.ok(problems.some((p) => p.includes("en words")));
  });

  it("should fail on a fix the source words in one locale only, or twice", () => {
    // Arrange
    const api = clone(loadMaster(), (copy) => {
      delete copy.WORDING.es["sign-in"];
      copy.WORDING.en.update.hint = "Or reinstall it.";
    });

    // Act
    const problems = masterProblems(api);

    // Assert
    assert.ok(problems.some((p) => p.includes("es words")));
    assert.ok(
      problems.some((p) => p.includes("exactly one message and one action"))
    );
  });

  it("should fail when the source states an unverified cause or names a bridge", () => {
    // Arrange
    const api = clone(loadMaster(), (copy) => {
      copy.WORDING.en["try-again"].message =
        "You are signed out of {platform}.";
      copy.WORDING.en.install.action = "Install the Kaiord extension";
    });

    // Act
    const problems = masterProblems(api);

    // Assert
    assert.ok(problems.some((p) => p.includes('"signed out"')));
    assert.ok(problems.some((p) => p.includes('"Kaiord extension"')));
    assert.ok(
      problems.some((p) =>
        p.includes('name the extension "Kaiord for {platform}"')
      )
    );
  });

  it("should fail a reason that resolves by a fifth fix or is worded in one locale only", () => {
    // Arrange
    const api = clone(loadMaster(), (copy) => {
      copy.REASONS["no-account-id"] = "reinstall";
      delete copy.REASON_WORDING.es["no-account-id"];
    });

    // Act
    const problems = masterProblems(api);

    // Assert
    assert.ok(problems.some((p) => p.includes('reason "no-account-id"')));
    assert.ok(problems.some((p) => p.includes("REASON_WORDING es")));
  });

  it("should fail a not-checked wording missing in Spanish or naming no Platform", () => {
    // Arrange
    const api = clone(loadMaster(), (copy) => {
      delete copy.NOT_CHECKED.es["would-mint-token"];
      copy.NOT_CHECKED.en["no-token-captured"] = "Nothing was checked.";
    });

    // Act
    const problems = masterProblems(api);

    // Assert
    assert.ok(problems.some((p) => p.includes("NOT_CHECKED es")));
    assert.ok(
      problems.some((p) =>
        p.includes(
          "NOT_CHECKED en.no-token-captured does not name the Platform"
        )
      )
    );
  });

  it("should allow the no-tab notice as the one exception and fail a second one", () => {
    // Arrange
    const api = clone(loadMaster(), (copy) => {
      copy.NO_TAB.en.hint = "Or reload.";
      copy.EXTRA_EXCEPTION = { en: { message: "x" } };
    });

    // Act
    const problems = masterProblems(api);
    const clean = masterProblems(loadMaster());

    // Assert
    assert.deepEqual(clean, []);
    assert.ok(
      problems.some((p) =>
        p.includes("NO_TAB en must hold exactly one message and one action")
      )
    );
    assert.ok(problems.some((p) => p.includes("EXTRA_EXCEPTION")));
  });

  it("should fail on a second wording of each fix, in English and in Spanish", () => {
    // Arrange
    const texts = [
      "Install the Kaiord extension for Garmin to send this workout.",
      "Requires the Kaiord extension",
      "Instala la extensión de Kaiord.",
      "Update the extension",
      "This Kaiord extension is out of date.",
      "Actualiza la extensión de Kaiord para Garmin.",
      "Sign in to Garmin Connect in this browser, then try again.",
      "Log in to Train2Go",
      "Session signed out",
      "Your coaching session expired — reconnect and retry.",
      "Inicia sesión en Garmin Connect.",
      "Tu sesión ha caducado",
      "Garmin is not answering. Try again.",
      "Bridge not responding",
      "The extension timed out before sending. Try again.",
      "Train2Go no responde.",
    ];

    // Act
    const problems = texts.map((text) => phrasingProblems(DICT, text));

    // Assert
    assert.ok(
      problems.every((p) => p.length === 1),
      JSON.stringify(problems)
    );
  });

  it("should fail on a fifth fix worded outside the source", () => {
    // Arrange
    const texts = [
      "Reload the page and try once more.",
      "Open app.whoop.com to resume.",
      "Restart your browser.",
      "Recarga la página.",
    ];

    // Act
    const problems = texts.flatMap((text) => phrasingProblems(DICT, text));

    // Assert
    assert.equal(problems.length, texts.length);
    assert.ok(problems.every((p) => p.includes("a fifth fix")));
  });

  it("should leave text that words no fix alone", () => {
    // Arrange
    const texts = [
      "Connected",
      "Kaiord for Garmin · detected",
      "Using your own Garmin sign-in",
      "Your zones were not synced.",
      "Desactualizada",
    ];

    // Act
    const problems = texts.flatMap((text) => phrasingProblems(DICT, text));

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should allow a listed phrase only where it is listed", () => {
    // Arrange
    const phrase = "AI request timed out";
    const listed =
      "packages/workout-spa-editor/src/i18n/locales/en/coaching.json#aiError.ai-timeout";

    // Act
    const there = phrasingProblems(listed, phrase);
    const elsewhere = phrasingProblems(DICT, phrase);

    // Assert
    assert.deepEqual(there, []);
    assert.equal(elsewhere.length, 1);
  });

  it("should report a listed phrase that left its surface", () => {
    // Arrange
    const allowed = [{ where: "a.json", phrase: "Reconnect", why: "test" }];

    // Act
    const problems = staleAllowed(
      [{ where: "a.json#k", text: "Other" }],
      allowed
    );

    // Assert
    assert.equal(problems.length, 1);
  });

  it("should read string literals but not comments", () => {
    // Arrange
    const src = [
      "// Sign in to Garmin is said by the notice",
      "/* Log in to Train2Go */",
      'const a = "Sign in to Garmin Connect now";',
      "const url = 'https://example.test/x';",
    ].join("\n");

    // Act
    const literals = literalsOf(src);

    // Assert
    assert.deepEqual(literals, ["Sign in to Garmin Connect now"]);
  });

  it("should fail a popup that skips the source, renames its Platform or opens another sign-in page", () => {
    // Arrange
    const root = mkdtempSync(join(tmpdir(), "notices-"));
    for (const dir of [
      "packages/workout-spa-editor/src/integrations",
      "packages/workout-spa-editor/src/application/connections",
      ...["garmin", "train2go", "whoop", "tanita", "trainingpeaks"].map(
        (b) => `packages/${b}-bridge`
      ),
    ]) {
      cpSync(join(ROOT, dir), join(root, dir), { recursive: true });
    }
    const popup = join(root, "packages/garmin-bridge/popup.js");
    writeFileSync(
      popup,
      readFileSync(popup, "utf8")
        .replace(
          'const PLATFORM = "Garmin";',
          'const PLATFORM = "Garmin Connect";'
        )
        .replace("https://connect.garmin.com/modern/", "https://example.test/")
        .replace("KAIORD_CONNECTION_NOTICES.noticeFor(", "wordIt(")
    );
    const html = join(root, "packages/tanita-bridge/popup.html");
    writeFileSync(
      html,
      readFileSync(html, "utf8").replace(
        '<script src="connection-notices.js"></script>',
        ""
      )
    );

    // Act
    const problems = popupProblems(root);
    rmSync(root, { recursive: true, force: true });

    // Assert
    assert.equal(problems.length, 4, JSON.stringify(problems));
    assert.ok(problems.some((p) => p.includes('the App names it "Garmin"')));
    assert.ok(problems.some((p) => p.includes("sign-in page")));
    assert.ok(
      problems.some((p) => p.includes("without KAIORD_CONNECTION_NOTICES"))
    );
    assert.ok(problems.some((p) => p.includes("tanita-bridge/popup.html")));
  });

  it("should read each sign-in page from the App's descriptor of that extension", () => {
    // Arrange
    const root = mkdtempSync(join(tmpdir(), "notices-descriptor-"));
    for (const dir of [
      "packages/workout-spa-editor/src/integrations",
      "packages/workout-spa-editor/src/application/connections",
      ...["garmin", "train2go", "whoop", "tanita", "trainingpeaks"].map(
        (b) => `packages/${b}-bridge`
      ),
    ]) {
      cpSync(join(ROOT, dir), join(root, dir), { recursive: true });
    }
    const descriptors = join(
      root,
      "packages/workout-spa-editor/src/application/connections/extension-descriptors.ts"
    );
    writeFileSync(
      descriptors,
      readFileSync(descriptors, "utf8").replace(
        'signInUrl: "https://app.train2go.com/user/index"',
        'signInUrl: "https://example.test/"'
      )
    );

    // Act
    const problems = popupProblems(root);
    rmSync(root, { recursive: true, force: true });

    // Assert
    assert.deepEqual(problems, [
      "packages/train2go-bridge/popup.js: does not open the App's sign-in page https://example.test/",
    ]);
  });

  it("should load the single source every extension vendors", () => {
    // Arrange
    const master = readFileSync(join(ROOT, MASTER));

    // Act
    const copies = [
      "garmin",
      "train2go",
      "whoop",
      "tanita",
      "trainingpeaks",
    ].map((b) =>
      readFileSync(join(ROOT, `packages/${b}-bridge/connection-notices.js`))
    );

    // Assert
    for (const copy of copies) assert.deepEqual(copy, master);
  });
});
