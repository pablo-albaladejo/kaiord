import { create } from "zustand";

const DEFAULT_LAMBDA_URL = "https://api.kaiord.com/push";

const normalizeLambdaUrl = (url: string): string => {
  const parsed = new URL(url);
  const isLocalhost =
    parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

  if (parsed.protocol !== "https:" && !isLocalhost) {
    throw new Error("Lambda URL must use HTTPS (except localhost)");
  }

  return parsed.toString();
};

type PushState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; id: string; name: string; url: string };

export type GarminStore = {
  username: string;
  password: string;
  lambdaUrl: string;
  push: PushState;
  setCredentials: (username: string, password: string) => void;
  setLambdaUrl: (url: string) => void;
  resetLambdaUrl: () => void;
  setPush: (state: PushState) => void;
  clearCredentials: () => void;
  hasCredentials: () => boolean;
};

export const useGarminStore = create<GarminStore>((set, get) => ({
  username: "",
  password: "",
  lambdaUrl: DEFAULT_LAMBDA_URL,
  push: { status: "idle" },

  setCredentials: (username, password) => set({ username, password }),

  setLambdaUrl: (url) => set({ lambdaUrl: normalizeLambdaUrl(url) }),

  resetLambdaUrl: () => set({ lambdaUrl: DEFAULT_LAMBDA_URL }),

  setPush: (push) => set({ push }),

  clearCredentials: () => set({ username: "", password: "" }),

  hasCredentials: () => {
    const { username, password } = get();
    return username.length > 0 && password.length > 0;
  },
}));
