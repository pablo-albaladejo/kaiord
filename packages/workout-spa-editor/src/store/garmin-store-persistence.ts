import { createSecureStorage } from "../lib/secure-storage";

const STORAGE_KEY = "garmin_credentials";
const storage = createSecureStorage("kaiord-spa-v1");

type PersistedGarminData = {
  username: string;
  password: string;
  lambdaUrl: string;
};

export const persistGarminData = async (
  data: PersistedGarminData
): Promise<void> => {
  try {
    await storage.set(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* silent — best-effort persistence */
  }
};

export const loadGarminData = async (): Promise<PersistedGarminData> => {
  try {
    const raw = await storage.get(STORAGE_KEY);
    if (!raw) return { username: "", password: "", lambdaUrl: "" };
    return JSON.parse(raw) as PersistedGarminData;
  } catch {
    return { username: "", password: "", lambdaUrl: "" };
  }
};
