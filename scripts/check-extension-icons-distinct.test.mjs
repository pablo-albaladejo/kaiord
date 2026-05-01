import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);
const GUARD = join(HERE, "check-extension-icons-distinct.mjs");
const BUILD = join(HERE, "build-extension-icons.mjs");

const ICON = (bridge, size) =>
  join(REPO, "packages", bridge, "icons", `icon${size}.png`);

const runGuard = () =>
  spawnSync("node", [GUARD], { cwd: REPO, encoding: "utf8" });

describe("check-extension-icons-distinct", () => {
  it("passes against the produced PNGs", () => {
    execFileSync("node", [BUILD], { cwd: REPO });

    const result = runGuard();

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /visually distinct/);
  });

  it("fails when the two bridges share an identical icon", async () => {
    execFileSync("node", [BUILD], { cwd: REPO });
    const original = readFileSync(ICON("train2go-bridge", 16));

    // Overwrite t2g 16x16 with garmin's bytes — guaranteed identical
    // → mean color delta = 0 < threshold.
    copyFileSync(ICON("garmin-bridge", 16), ICON("train2go-bridge", 16));

    try {
      const result = runGuard();
      assert.equal(result.status, 1);
      assert.match(result.stderr, /mean color delta/);
    } finally {
      writeFileSync(ICON("train2go-bridge", 16), original);
    }
  });

  it("fails when a bridge icon's accent occupies <25% of pixel mass at 16x16", async () => {
    execFileSync("node", [BUILD], { cwd: REPO });
    const original = readFileSync(ICON("train2go-bridge", 16));

    // Make a near-all-dark icon: keep the navy bg, drop accent — so the
    // accent-mass check fails for t2g while inter-bridge delta still
    // passes (garmin still has blue accent).
    const allNavy = await sharp({
      create: {
        width: 16,
        height: 16,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
    writeFileSync(ICON("train2go-bridge", 16), allNavy);

    try {
      const result = runGuard();
      assert.equal(result.status, 1);
      assert.match(result.stderr, /accent.*pixels/);
    } finally {
      writeFileSync(ICON("train2go-bridge", 16), original);
    }
  });
});
