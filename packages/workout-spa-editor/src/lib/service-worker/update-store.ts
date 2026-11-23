// What the update prompt shows, plus the two facts the update flow shares:
// the registration it acts on and whether this tab asked for the reload.

export type UpdateState = "idle" | "available" | "blocked" | "applying";

let state: UpdateState = "idle";
let registration: ServiceWorkerRegistration | null = null;
let reloadRequested = false;
const listeners = new Set<() => void>();

export const getUpdateState = (): UpdateState => state;

export function setUpdateState(next: UpdateState): void {
  if (next === state) return;
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribeUpdateState(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getRegistration = () => registration;

export function setRegistration(next: ServiceWorkerRegistration): void {
  registration = next;
}

export const requestReload = (): void => {
  reloadRequested = true;
};

export const isReloadRequested = (): boolean => reloadRequested;
