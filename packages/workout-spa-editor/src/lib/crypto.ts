const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100_000;

const copyBytes = (data: Uint8Array): Uint8Array =>
  new Uint8Array(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  );

const deriveKey = async (
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    copyBytes(encoder.encode(passphrase)) as BufferSource,
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

export const encrypt = async (
  plaintext: string,
  passphrase: string
): Promise<string> => {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: copyBytes(iv) as BufferSource },
    key,
    copyBytes(encoder.encode(plaintext)) as BufferSource
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
  passphrase: string
): Promise<string> => {
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: copyBytes(iv) as BufferSource },
    key,
    copyBytes(ciphertext) as BufferSource
  );

  return new TextDecoder().decode(decrypted);
};
