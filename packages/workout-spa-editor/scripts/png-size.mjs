const PNG_SIGNATURE = "89504e470d0a1a0a";

/** Width and height from a PNG's IHDR chunk, which always comes first. */
export function pngSize(bytes) {
  if (bytes.subarray(0, 8).toString("hex") !== PNG_SIGNATURE) {
    throw new Error("not a PNG");
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
