import { create } from "zustand";

import { createGarminActions } from "./garmin-store-actions";

const DEFAULT_LAMBDA_URL: string = import.meta.env.VITE_GARMIN_LAMBDA_URL || "";

export const isValidLambdaUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    const isLocal =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    return parsed.protocol === "https:" || isLocal;
  } catch {
    return false;
  }
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
  hydrated: boolean;
  setCredentials: (username: string, password: string) => void;
  setLambdaUrl: (url: string) => void;
  resetLambdaUrl: () => void;
  setPush: (state: PushState) => void;
  clearCredentials: () => void;
  hasCredentials: () => boolean;
  hydrate: () => Promise<void>;
};

export const useGarminStore = create<GarminStore>((set, get) => ({
  username: "",
  password: "",
  lambdaUrl: DEFAULT_LAMBDA_URL,
  push: { status: "idle" },
  hydrated: false,

  ...createGarminActions(set, get, DEFAULT_LAMBDA_URL),

  setPush: (push) => set({ push }),

  hasCredentials: () => {
    const { username, password } = get();
    return username.length > 0 && password.length > 0;
  },
}));
