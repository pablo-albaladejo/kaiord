import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);

// Read the constant directly from @kaiord/core's source to avoid a
// repo-root devDependency on the package. The source file is the
// single source of truth; snapshot bridges vendor a literal copy in
// the bridge-core popup snapshot module (master + byte-identical
// vendored copies, see scripts/check-bridge-core-parity.test.mjs).
const SOURCE = readFileSync(
  join(REPO, "packages/core/src/protocol/profile-snapshot.ts"),
  "utf8"
);
const sourceMatch = SOURCE.match(
  /export const STALE_SNAPSHOT_THRESHOLD_DAYS\s*=\s*(\d+)/
);
if (!sourceMatch) {
  throw new Error(
    "Could not extract STALE_SNAPSHOT_THRESHOLD_DAYS from @kaiord/core source"
  );
}
const STALE_SNAPSHOT_THRESHOLD_DAYS = Number.parseInt(sourceMatch[1], 10);

const BRIDGES = ["garmin-bridge", "train2go-bridge"];
const REGEX = /STALE_SNAPSHOT_THRESHOLD_DAYS\s*=\s*(\d+)/;

describe("STALE_SNAPSHOT_THRESHOLD_DAYS parity", () => {
  it("each snapshot bridge vendors the same value as @kaiord/core", () => {
    for (const bridge of BRIDGES) {
      const popup = readFileSync(
        join(REPO, "packages", bridge, "bridge-popup-snapshot.js"),
        "utf8"
      );
      const match = popup.match(REGEX);
      assert.ok(
        match,
        `${bridge}/bridge-popup-snapshot.js missing STALE_SNAPSHOT_THRESHOLD_DAYS literal`
      );
      const vendored = Number.parseInt(match[1], 10);
      assert.equal(
        vendored,
        STALE_SNAPSHOT_THRESHOLD_DAYS,
        `${bridge} vendors ${vendored} but @kaiord/core exports ${STALE_SNAPSHOT_THRESHOLD_DAYS}`
      );
    }
  });
});
