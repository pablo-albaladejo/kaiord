import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

// Drives the App's service worker from a spec: waits for it to control a
// page, asks it for an update, and reads what it cached. A worker that has
// just installed controls a page only from its next navigation (it never
// claims), which is the path a returning athlete takes.

const CONTROL_TIMEOUT_MS = 45_000;

/** Loads `url`, waits for the worker to activate, and reloads under it. */
export async function takeControl(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => isControlled(page), { timeout: CONTROL_TIMEOUT_MS })
    .toBe(true);
}

export const isControlled = (page: Page): Promise<boolean> =>
  page.evaluate(() => navigator.serviceWorker.controller !== null);

/** Asks the browser to fetch sw.js again, as a navigation would. */
export const checkForUpdate = (page: Page): Promise<void> =>
  page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update().catch(() => undefined);
  });

export const cacheNames = (page: Page): Promise<string[]> =>
  page.evaluate(() => caches.keys());

export const hasRegistration = (page: Page): Promise<boolean> =>
  page.evaluate(async () =>
    Boolean(await navigator.serviceWorker.getRegistration())
  );

/** The cache name the worker emitted into `site` will install. */
export function cacheOf(site: string): string {
  const source = readFileSync(join(site, "app/sw.js"), "utf8");
  const config = JSON.parse(/^const SW = (\{.*\});$/m.exec(source)![1]);
  return `kaiord-app-${config.version}`;
}

/** A page-wide marker that a reload clears. */
export const markDocument = (page: Page): Promise<void> =>
  page.evaluate(() => {
    (window as unknown as { __sameDocument?: boolean }).__sameDocument = true;
  });

export const isSameDocument = (page: Page): Promise<boolean> =>
  page.evaluate(
    () =>
      (window as unknown as { __sameDocument?: boolean }).__sameDocument ===
      true
  );

/** Runs `action` and waits for the page to load a new document from it. */
export async function reloadsOn(
  page: Page,
  action: () => Promise<unknown>,
  timeout = CONTROL_TIMEOUT_MS
): Promise<void> {
  const loaded = page.waitForEvent("load", { timeout });
  // The navigation may destroy the context the action is evaluating in.
  await action().catch(() => undefined);
  await loaded;
}

/** The next build: a changed shell, as any deploy changes it. */
export const nextBuild =
  (label: string, alsoRemove?: RegExp) =>
  (app: string): void => {
    const index = join(app, "index.html");
    writeFileSync(index, `${readFileSync(index, "utf8")}<!-- ${label} -->\n`);
    if (!alsoRemove) return;
    for (const name of readdirSync(join(app, "assets"))) {
      if (alsoRemove.test(name)) rmSync(join(app, "assets", name));
    }
  };

/** An edge still serving other bytes for the shell than the worker lists. */
export const staleShellAtTheEdge = (site: string): void => {
  const index = join(site, "app/index.html");
  writeFileSync(index, `${readFileSync(index, "utf8")}<!-- stale edge -->\n`);
};
