import { decrypt, encrypt } from "./crypto";

const PREFIX = "kaiord_secure_";

export const createSecureStorage = (passphrase: string) => ({
  set: async (key: string, value: string): Promise<void> => {
    const encrypted = await encrypt(value, passphrase);
    localStorage.setItem(`${PREFIX}${key}`, encrypted);
  },

  get: async (key: string): Promise<string | null> => {
    const stored = localStorage.getItem(`${PREFIX}${key}`);
    if (!stored) return null;
    return decrypt(stored, passphrase);
  },

  remove: (key: string): void => {
    localStorage.removeItem(`${PREFIX}${key}`);
  },

  has: (key: string): boolean =>
    localStorage.getItem(`${PREFIX}${key}`) !== null,

  clearAll: (): void => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
    keys.forEach((k) => {
      localStorage.removeItem(k);
    });
  },
});

export type SecureStorage = ReturnType<typeof createSecureStorage>;
