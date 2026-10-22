import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildCassette,
  simpleWorkout,
} from "../../test-utils/cassette-builder";
import { sha256Hex } from "../cassettes/canonical-hash";
import { checkManifest, manifestSchema } from "../cassettes/manifest";
import { createParserReplaySuite } from "../cassettes/parser-replay-suite";
import { serialize, writeCassette } from "./cassette-writer";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..", "..", "..");
const COMMITTED = "packages/ai/src/evals/cassettes/committed";
const JSON_GLOB = "*.{md,json,yml,yaml}";

let sandbox: string;

/** The pre-commit hook's command for staged JSON, run as lint-staged runs it. */
const lintStagedJsonCommand = (): Array<string> => {
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));
  return pkg["lint-staged"][JSON_GLOB];
};

const runHook = (files: Array<string>) => {
  const [command] = lintStagedJsonCommand();
  const [binary, ...args] = (command ?? "").split(" ");
  execFileSync(
    join(REPO_ROOT, "node_modules", ".bin", binary ?? ""),
    [...args, ...files],
    {
      cwd: sandbox,
      stdio: "pipe",
    }
  );
};

/** A recorded answer holding a short array, which prettier would collapse. */
const recordInto = async (dir: string) => {
  const suite = createParserReplaySuite();
  const { cassette } = await buildCassette(
    suite,
    "cycling-simple",
    simpleWorkout("cycling")
  );
  const answer = { ...simpleWorkout("cycling"), tags: [1, 2] };
  return writeCassette(
    {
      ...cassette,
      response: { ...cassette.response, structuredOutput: answer },
    },
    {
      committedDir: dir,
      iterationDir: join(sandbox, "iteration"),
      servedForm: "bare",
    }
  );
};

describe("committed cassette formatting", () => {
  beforeEach(() => {
    sandbox = mkdtempSync(join(tmpdir(), "cassette-format-"));
    for (const config of [".prettierignore", ".prettierrc"]) {
      copyFileSync(join(REPO_ROOT, config), join(sandbox, config));
    }
    mkdirSync(join(sandbox, COMMITTED), { recursive: true });
    mkdirSync(join(sandbox, "control"));
    writeFileSync(
      join(sandbox, COMMITTED, "manifest.json"),
      serialize({ cassettes: [] })
    );
  });
  afterEach(() => rmSync(sandbox, { recursive: true, force: true }));

  it("should run prettier --write on staged JSON in the pre-commit hook", () => {
    // Arrange
    const expected = ["prettier --write"];

    // Act
    const command = lintStagedJsonCommand();

    // Assert
    expect(command).toEqual(expected);
  });

  it("should keep a recorded cassette's digest through the hook's formatting", async () => {
    // Arrange
    const path = await recordInto(join(sandbox, COMMITTED));
    const recorded = readFileSync(path, "utf8");
    const file = join(COMMITTED, path.split("/").pop() ?? "");
    writeFileSync(join(sandbox, "control", "cassette.json"), recorded);

    // Act
    runHook([file, join(COMMITTED, "manifest.json"), "control/cassette.json"]);

    // Assert
    const after = readFileSync(join(sandbox, file));
    const manifest = manifestSchema.parse(
      JSON.parse(
        readFileSync(join(sandbox, COMMITTED, "manifest.json"), "utf8")
      )
    );
    const cassette = JSON.parse(after.toString("utf8"));
    expect(after.toString("utf8")).toBe(recorded);
    expect(
      checkManifest(manifest, [{ cassette, digest: sha256Hex(after) }]).faults
    ).toEqual([]);
    // Control: outside the ignored directory the same bytes are rewritten.
    expect(
      readFileSync(join(sandbox, "control", "cassette.json"), "utf8")
    ).not.toBe(recorded);
  });
});
