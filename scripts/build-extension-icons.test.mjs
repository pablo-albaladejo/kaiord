import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);
// Build into a private root: other script tests run concurrently under
// `node --test`, and the tracked PNGs under packages/*/icons must never be
// rewritten (or tampered with) by a test.
const ICONS_ROOT = mkdtempSync(join(tmpdir(), "kaiord-icons-"));
const ENV = { ...process.env, KAIORD_ICONS_ROOT: ICONS_ROOT };
after(() => rmSync(ICONS_ROOT, { recursive: true, force: true }));
const BUILD = join(HERE, "build-extension-icons.mjs");
const MASTER = join(REPO, "packages/_shared/extension-icon/master.svg");

const BRIDGES = [
  "garmin-bridge",
  "train2go-bridge",
  "whoop-bridge",
  "trainingpeaks-bridge",
  "tanita-bridge",
];
const SIZES = [16, 48, 128];

const iconPath = (bridge, size) =>
  join(ICONS_ROOT, "packages", bridge, "icons", `icon${size}.png`);

describe("build-extension-icons", () => {
  it("produces a PNG per bridge and size at expected dimensions", async () => {
    execFileSync("node", [BUILD], { cwd: REPO, env: ENV });

    for (const bridge of BRIDGES) {
      for (const size of SIZES) {
        const path = iconPath(bridge, size);
        const stats = statSync(path);
        assert.ok(stats.size > 100, `${path} is suspiciously small`);
        const meta = await sharp(path).metadata();
        assert.equal(meta.width, size, `${path} width`);
        assert.equal(meta.height, size, `${path} height`);
        assert.equal(meta.format, "png");
      }
    }
  });

  it("substitutes the per-bridge accent into the rendered output", async () => {
    execFileSync("node", [BUILD], { cwd: REPO, env: ENV });

    const garmin = await sharp(iconPath("garmin-bridge", 128))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const t2g = await sharp(iconPath("train2go-bridge", 128))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Sample the centre pixel — the master places a solid accent
    // dot at viewBox centre, so this pixel MUST carry the bridge accent.
    const centerOf = (b) => {
      const ch = b.info.channels;
      const idx =
        ((b.info.width * (b.info.height / 2) + b.info.width / 2) | 0) * ch;
      return [b.data[idx], b.data[idx + 1], b.data[idx + 2]];
    };
    const [gr, gg, gb] = centerOf(garmin);
    const [tr, tg, tb] = centerOf(t2g);

    // Garmin accent #007cc3: blue-dominant, low red.
    assert.ok(
      gb > gr + 50,
      `garmin centre should be blue-dominant: rgb(${gr},${gg},${gb})`
    );
    // Train2Go accent #f74464: red-dominant, low blue.
    assert.ok(
      tr > tb + 50,
      `t2g centre should be red-dominant: rgb(${tr},${tg},${tb})`
    );
  });

  it("master SVG contains the __ACCENT__ placeholder (not yet substituted)", () => {
    const src = readFileSync(MASTER, "utf8");
    assert.match(src, /__ACCENT__/);
  });
});
