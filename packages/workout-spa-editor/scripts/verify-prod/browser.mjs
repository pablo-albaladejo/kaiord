import { chromium, devices } from "@playwright/test";

export { oneLine } from "./lib.mjs";

export const TIMEOUT = 15_000;

export function launchBrowser() {
  return chromium.launch();
}

const DESKTOP = { viewport: { width: 1366, height: 860 } };

export async function openSession(browser, base, { mobile = false } = {}) {
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
  const errors = [];
  const failedRequests = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`);
  });
  const go = (hash) => gotoHash(page, base, hash);
  return { ctx, page, errors, failedRequests, go };
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
// snapshots taken 400 ms apart agree.
export async function settledText(page, read = () => document.body.innerText) {
  let previous = await page.evaluate(read);
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(400);
    const current = await page.evaluate(read);
    if (current === previous) return current;
    previous = current;
  }
  return previous;
}
