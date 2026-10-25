import { strict as assert } from "node:assert";
import { test } from "node:test";

import { pngSize } from "./png-size.mjs";

const header = (width, height) => {
  const bytes = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
};

test("pngSize reads the IHDR width and height", () => {
  assert.deepEqual(pngSize(header(192, 512)), { width: 192, height: 512 });
});

test("pngSize rejects bytes that are not a PNG", () => {
  assert.throws(() => pngSize(Buffer.alloc(24)), /not a PNG/);
});
