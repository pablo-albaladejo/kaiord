import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);
const MASTER = join(REPO, "packages/_shared/popup/popup.css");
const TARGETS = [
  join(REPO, "packages/garmin-bridge/popup.css"),
  join(REPO, "packages/train2go-bridge/popup.css"),
];

describe("popup CSS parity", () => {
  it("each bridge popup.css is byte-identical to the master", () => {
    const master = readFileSync(MASTER);
    for (const target of TARGETS) {
      const body = readFileSync(target);
      assert.equal(
        body.length,
        master.length,
        `${target} differs in length from master`
      );
      assert.deepEqual(body, master, `${target} content drifts from master`);
    }
  });

  it("fails when a target drifts from the master", () => {
    const target = TARGETS[0];
    const original = readFileSync(target);
    writeFileSync(target, `${original.toString("utf8")}\n/* drift */\n`);
    try {
      const master = readFileSync(MASTER);
      const body = readFileSync(target);
      assert.notEqual(body.length, master.length);
    } finally {
      writeFileSync(target, original);
    }
  });
});
