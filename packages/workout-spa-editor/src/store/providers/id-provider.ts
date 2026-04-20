import type { ItemId } from "./item-id";
import { asItemId } from "./item-id";

export type IdProvider = () => ItemId;

const HEX_CHARS = "0123456789abcdef";

const toHex = (byte: number): string =>
  HEX_CHARS[(byte >> 4) & 0xf] + HEX_CHARS[byte & 0xf];

const uuidV4FromCrypto = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // RFC 4122 v4: set version (4) and variant (10xx) bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, toHex).join("");

  return (
    hex.slice(0, 8) +
    "-" +
    hex.slice(8, 12) +
    "-" +
    hex.slice(12, 16) +
    "-" +
    hex.slice(16, 20) +
    "-" +
    hex.slice(20, 32)
  );
};

/**
 * Default ID provider. Prefers crypto.randomUUID; falls back to a v4 UUID
 * built from crypto.getRandomValues so the SPA boots in non-secure contexts
 * (LAN / Tailscale dev). Never falls through to Math.random — collision
 * resistance is required for history-snapshot integrity.
 */
export const defaultIdProvider: IdProvider = () => {
  if (typeof crypto?.randomUUID === "function") {
    return asItemId(crypto.randomUUID());
  }
  if (typeof crypto?.getRandomValues === "function") {
    return asItemId(uuidV4FromCrypto());
  }
  throw new Error(
    "No secure random source available for IdProvider (crypto.randomUUID and crypto.getRandomValues are both missing)"
  );
};
