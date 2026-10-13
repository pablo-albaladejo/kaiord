/**
 * The browser-side halves of "delete all my data". Every key in this
 * origin's Web Storage is Kaiord's (the app, the landing and the docs share
 * it), so the stores are cleared whole: a key added later is covered too.
 */

const storages = (): Array<() => Storage> => [
  () => window.localStorage,
  () => window.sessionStorage,
];

export const clearDeviceStorage = (): void => {
  for (const storage of storages()) {
    try {
      storage().clear();
    } catch {
      // Storage is blocked: nothing of ours could have been written there.
    }
  }
};

/** A full page load of the app's entry route: the first-run path. */
export const reloadToFirstRun = (): void => {
  window.location.replace(window.location.pathname);
};
