const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100_000;

const copyBytes = (data: Uint8Array): Uint8Array =>
  new Uint8Array(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  );

const bytes = (text: string): BufferSource =>
  copyBytes(new TextEncoder().encode(text)) as BufferSource;

const deriveKey = async (
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    bytes(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: copyBytes(salt) as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

// AAD: authenticated by the AES-GCM tag but not encrypted; decryption
// fails unless the identical value is supplied. Binds cleartext metadata
// (e.g. a snapshot manifest) to the ciphertext so tampering is detectable.
const gcmParams = (iv: Uint8Array, additionalData?: string): AesGcmParams => ({
  name: "AES-GCM",
  iv: copyBytes(iv) as BufferSource,
  ...(additionalData !== undefined && {
    additionalData: bytes(additionalData),
  }),
});

export const encrypt = async (
  plaintext: string,
  passphrase: string,
  additionalData?: string
): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);

  const ciphertext = await crypto.subtle.encrypt(
    gcmParams(iv, additionalData),
    key,
    bytes(plaintext)
  );

  const combined = new Uint8Array(
    salt.length + iv.length + ciphertext.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
};

export const decrypt = async (
  encoded: string,
  passphrase: string,
  additionalData?: string
): Promise<string> => {
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt(
    gcmParams(iv, additionalData),
    key,
    copyBytes(ciphertext) as BufferSource
  );

  return new TextDecoder().decode(decrypted);
};
