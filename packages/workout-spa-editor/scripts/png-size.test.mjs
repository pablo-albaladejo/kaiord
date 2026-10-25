import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { decodedPngSize } from "./png-size.mjs";

const ICON = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "app-icon-192.png"
);

test("decodedPngSize decodes a real PNG to its pixel size", async () => {
  const size = await decodedPngSize(readFileSync(ICON));

  assert.deepEqual(size, { width: 192, height: 192 });
});

// A valid signature and IHDR with the image data cut off: the header alone
// names a size, so only a full decode can tell this file is broken.
test("decodedPngSize rejects a truncated PNG whose header is valid", async () => {
  const truncated = readFileSync(ICON).subarray(0, 64);

  await assert.rejects(decodedPngSize(truncated));
});

test("decodedPngSize rejects bytes that are not a PNG", async () => {
  await assert.rejects(decodedPngSize(Buffer.alloc(64)));
});
