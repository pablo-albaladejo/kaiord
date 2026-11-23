/**
 * Kaiord Garmin Bridge — the one FIT file the extension uploads
 *
 * The App's body-composition upload (@kaiord/fit `encodeBodyCompositionFit`)
 * is a FIT file of file type 9 ("weight") holding one `file_id` message and
 * one `weight_scale` message. This reads the FIT header and walks every
 * record, and admits only that file: the right size and both CRCs, a
 * `file_id` first with file type 9, then one `weight_scale`, no other
 * message and no developer field. Anything else, an activity file included,
 * is refused before any token is touched.
 */

// Wrapped so its names never meet the worker's own top-level declarations:
// importScripts shares one global lexical scope.
const garminFitCheck = (() => {
  const FILE_TYPE_WEIGHT = 9;
  const MESG_FILE_ID = 0;
  const MESG_WEIGHT_SCALE = 30;
  const FILE_ID_TYPE_FIELD = 0;
  const MAX_BYTES = 4096;
  const CRC_BYTES = 2;
  const SIGNATURE = ".FIT";
  const HEADER_SIZES = [12, 14];

  const CRC_TABLE = [
    0x0000, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401, 0xa001,
    0x6c00, 0x7800, 0xb401, 0x5000, 0x9c01, 0x8801, 0x4400,
  ];

  const crcNibble = (crc, nibble) =>
    ((crc >> 4) & 0x0fff) ^ CRC_TABLE[crc & 0xf] ^ CRC_TABLE[nibble];

  const crc16 = (bytes, end) => {
    let crc = 0;
    for (let i = 0; i < end; i += 1) {
      crc = crcNibble(crc, bytes[i] & 0xf);
      crc = crcNibble(crc, (bytes[i] >> 4) & 0xf);
    }
    return crc;
  };

  const u16 = (b, i, bigEndian = false) =>
    bigEndian ? (b[i] << 8) | b[i + 1] : b[i] | (b[i + 1] << 8);
  const u32 = (b, i) =>
    (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16)) + b[i + 3] * 0x1000000;

  const isByteArray = (v) =>
    Array.isArray(v) &&
    v.length <= MAX_BYTES &&
    v.every((x) => Number.isInteger(x) && x >= 0 && x <= 255);

  const headerHolds = (b) => {
    const size = b[0];
    if (!HEADER_SIZES.includes(size) || b.length < size + CRC_BYTES) return 0;
    if (String.fromCharCode(...b.slice(8, 12)) !== SIGNATURE) return 0;
    if (b.length !== size + u32(b, 4) + CRC_BYTES) return 0;
    const headerCrc = size === 14 ? u16(b, 12) : 0;
    if (headerCrc !== 0 && headerCrc !== crc16(b, 12)) return 0;
    return crc16(b, b.length - CRC_BYTES) === u16(b, b.length - CRC_BYTES)
      ? size
      : 0;
  };

  // A definition record → { global, size, typeOffset } or null if refused.
  const readDefinition = (b, i) => {
    const global = u16(b, i + 2, b[i + 1] === 1);
    const count = b[i + 4];
    if (global !== MESG_FILE_ID && global !== MESG_WEIGHT_SCALE) return null;
    let size = 0;
    let typeOffset = -1;
    for (let f = 0; f < count; f += 1) {
      const at = i + 5 + f * 3;
      if (b[at] === FILE_ID_TYPE_FIELD && global === MESG_FILE_ID) {
        typeOffset = size;
      }
      size += b[at + 1];
    }
    if (global === MESG_FILE_ID && typeOffset < 0) return null;
    return { global, size, typeOffset, length: 5 + count * 3 };
  };

  // Walks every record; true only for file_id (weight) then one weight_scale.
  const recordsHold = (b, start, end) => {
    const defs = [];
    const seen = [];
    let i = start;
    while (i < end) {
      const header = b[i];
      i += 1;
      if (header & 0x80 || header & 0x20) return false;
      const local = header & 0xf;
      if (header & 0x40) {
        const def = readDefinition(b, i);
        if (!def) return false;
        defs[local] = def;
        i += def.length;
        continue;
      }
      const def = defs[local];
      if (!def) return false;
      if (
        def.global === MESG_FILE_ID &&
        b[i + def.typeOffset] !== FILE_TYPE_WEIGHT
      )
        return false;
      seen.push(def.global);
      i += def.size;
    }
    return (
      i === end &&
      seen.length === 2 &&
      seen[0] === MESG_FILE_ID &&
      seen[1] === MESG_WEIGHT_SCALE
    );
  };

  const isBodyCompositionFit = (bytes) => {
    if (!isByteArray(bytes)) return false;
    const headerSize = headerHolds(bytes);
    if (!headerSize) return false;
    return recordsHold(bytes, headerSize, bytes.length - CRC_BYTES);
  };

  return { isBodyCompositionFit, MAX_BYTES, FILE_TYPE_WEIGHT };
})();

if (typeof module !== "undefined") {
  module.exports = garminFitCheck;
} else if (typeof self !== "undefined") {
  self.garminFitCheck = garminFitCheck;
}
