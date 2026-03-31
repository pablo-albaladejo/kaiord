import { loadGarminData, persistGarminData } from "./garmin-store-persistence";

type GarminState = {
  username: string;
  password: string;
  lambdaUrl: string;
  hydrated: boolean;
};

type Set = (
  fn: Partial<GarminState> | ((s: GarminState) => Partial<GarminState>)
) => void;
type Get = () => GarminState;

const persist = (get: Get): void => {
  const { username, password, lambdaUrl } = get();
  persistGarminData({ username, password, lambdaUrl });
};

const STALE_URL = "https://api.kaiord.com/push";

const migrateStaleUrl = (url: string): string => (url === STALE_URL ? "" : url);

export const createGarminActions = (
  set: Set,
  get: Get,
  defaultUrl: string
) => ({
  hydrate: async () => {
    const data = await loadGarminData();
    const migrated = migrateStaleUrl(data.lambdaUrl);
    set({
      username: data.username,
      password: data.password,
      lambdaUrl: migrated || defaultUrl,
      hydrated: true,
    });
  },

  setCredentials: (username: string, password: string) => {
    set({ username, password });
    persist(get);
  },

  setLambdaUrl: (url: string) => {
    set({ lambdaUrl: url });
    persist(get);
  },

  resetLambdaUrl: () => {
    set({ lambdaUrl: defaultUrl });
    persist(get);
  },

  clearCredentials: () => {
    set({ username: "", password: "" });
    persist(get);
  },
});
