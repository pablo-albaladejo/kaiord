import { describe, it } from "node:test";
import { strictEqual } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(here, "check-tsup-ignoredeprecations.mjs");
const scriptSource = readFileSync(scriptPath, "utf8");

/**
 * Spawn the watchdog from a synthetic repo root with a pnpm-style tsup
 * install tree (`node_modules/.pnpm/tsup@<version>_<hash>/node_modules/tsup`).
 * Returns {status, stderr}.
 */
function runWithFakeTsup({ installs, rollupSrc }) {
  const fakeRoot = mkdtempSync(join(tmpdir(), "tsup-watchdog-"));
  const pnpmDir = join(fakeRoot, "node_modules", ".pnpm");
  mkdirSync(pnpmDir, { recursive: true });

  for (const { version, peerHash = "abc" } of installs) {
    const entryName = `tsup@${version}_${peerHash}`;
    const tsupDir = join(pnpmDir, entryName, "node_modules", "tsup");
    mkdirSync(join(tsupDir, "dist"), { recursive: true });
    writeFileSync(
      join(tsupDir, "package.json"),
      JSON.stringify({ name: "tsup", version }),
    );
    writeFileSync(join(tsupDir, "dist", "rollup.js"), rollupSrc);
  }

  const fakeScriptsDir = join(fakeRoot, "scripts");
  mkdirSync(fakeScriptsDir, { recursive: true });
  const fakeScriptPath = join(fakeScriptsDir, "check-tsup-ignoredeprecations.mjs");
  writeFileSync(fakeScriptPath, scriptSource);

  let status = 0;
  let stderr = "";
  try {
    execFileSync(process.execPath, [fakeScriptPath], {
      encoding: "utf8",
      stdio: ["ignore", "ignore", "pipe"],
    });
  } catch (err) {
    status = err.status ?? 1;
    stderr = err.stderr?.toString() ?? "";
  }

  rmSync(fakeRoot, { recursive: true, force: true });
  return { status, stderr };
}

const FORCED_ROLLUP_SRC = `
  function defineOptions(options) {
    return {
      baseUrl: compilerOptions.baseUrl || ".",
      declaration: true,
    };
  }
`;
const FIXED_ROLLUP_SRC = `
  function defineOptions(options) {
    return {
      declaration: true,
    };
  }
`;

describe("scripts/check-tsup-ignoredeprecations.mjs", () => {
  it("exits 0 when tsup's rollup.js still forces baseUrl (silencer still justified)", () => {
    const { status } = runWithFakeTsup({
      installs: [{ version: "8.5.1" }],
      rollupSrc: FORCED_ROLLUP_SRC,
    });
    strictEqual(status, 0);
  });

  it("exits 1 when tsup no longer forces baseUrl (silencer is now dead config)", () => {
    const { status, stderr } = runWithFakeTsup({
      installs: [{ version: "9.0.0" }],
      rollupSrc: FIXED_ROLLUP_SRC,
    });
    strictEqual(status, 1);
    strictEqual(stderr.includes("tsconfig.base.json"), true);
    strictEqual(stderr.includes("ignoreDeprecations"), true);
  });

  it("exits 2 when no tsup is installed under node_modules/.pnpm", () => {
    const fakeRoot = mkdtempSync(join(tmpdir(), "tsup-watchdog-empty-"));
    mkdirSync(join(fakeRoot, "node_modules", ".pnpm"), { recursive: true });

    const fakeScriptsDir = join(fakeRoot, "scripts");
    mkdirSync(fakeScriptsDir, { recursive: true });
    const fakeScriptPath = join(fakeScriptsDir, "check-tsup-ignoredeprecations.mjs");
    writeFileSync(fakeScriptPath, scriptSource);

    let status = 0;
    let stderr = "";
    try {
      execFileSync(process.execPath, [fakeScriptPath], {
        encoding: "utf8",
        stdio: ["ignore", "ignore", "pipe"],
      });
    } catch (err) {
      status = err.status ?? 1;
      stderr = err.stderr?.toString() ?? "";
    }

    rmSync(fakeRoot, { recursive: true, force: true });

    strictEqual(status, 2);
    strictEqual(stderr.includes("no tsup installation found"), true);
  });

  it("exits 2 when multiple tsup versions are installed (ambiguous)", () => {
    const { status, stderr } = runWithFakeTsup({
      installs: [
        { version: "8.5.1", peerHash: "aa" },
        { version: "9.0.0", peerHash: "bb" },
      ],
      rollupSrc: FORCED_ROLLUP_SRC,
    });
    strictEqual(status, 2);
    strictEqual(stderr.includes("multiple tsup versions"), true);
  });
});
