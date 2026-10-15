import { chromium, devices } from "@playwright/test";

import { attachEvidence, createEvidence } from "./evidence.mjs";

export { oneLine } from "./lib.mjs";

export const TIMEOUT = 15_000;

export function launchBrowser() {
  return chromium.launch();
}

const DESKTOP = { viewport: { width: 1366, height: 860 } };

export async function openSession(
  browser,
  base,
  { mobile = false, startedAt = Date.now() } = {}
) {
  const device = mobile ? { ...devices["iPhone 13"] } : DESKTOP;
  delete device.defaultBrowserType;
  const ctx = await browser.newContext({
    ...device,
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    acceptDownloads: true,
  });
  ctx.setDefaultTimeout(TIMEOUT);
  const page = await ctx.newPage();
  const collector = createEvidence(startedAt);
  attachEvidence(page, collector);
  const go = (hash) => gotoHash(page, base, hash);
  const { evidence } = collector;
  return { ctx, page, errors: evidence.errors, evidence, go };
}

async function gotoHash(page, base, hash) {
  const target = `${base}/#/${hash.replace(/^#?\/?/, "")}`;
  const loaded = page.url().startsWith(base);
  await page.goto(target);
  if (loaded) await page.reload();
  await page.locator("main").first().waitFor({ state: "visible" });
}

export function exact(text) {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s*${escaped}\\s*$`);
}

export function mainText(page) {
  return page.locator("main").first().innerText();
}

export function isoDate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function mondayOf(d) {
  const m = new Date(d);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

// Dexie live queries render after the route's heading, so read until two
// snapshots taken 400 ms apart agree. With a locator as `target`, `read`
// receives its element.
export async function settledText(
  page,
  read = () => document.body.innerText,
  target = page
) {
  let previous = await target.evaluate(read);
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(400);
    const current = await target.evaluate(read);
    if (current === previous) return current;
    previous = current;
  }
  return previous;
}
