import { expect } from "@playwright/test";

import { oneLine, TIMEOUT } from "./browser.mjs";

export const FIXTURES = new URL("../../../../test-fixtures/", import.meta.url)
  .pathname;

export async function expectOk(rec, msg, assertion, observe) {
  try {
    await assertion();
    return rec.assert(true, msg);
  } catch {
    const observed = observe ? await observe().catch((e) => e.message) : "";
    return rec.assert(false, msg, oneLine(String(observed)));
  }
}

// A clean browser already has its default athlete; one with none gets one
// from #/athletes, where athletes are created now (P-15).
export async function ensureProfile(session) {
  const { page, go } = session;
  await go("athlete");
  const identity = page.getByTestId("athlete-identity");
  const empty = page.getByRole("link", { name: "Crear atleta" });
  await identity.or(empty).first().waitFor();
  if (await identity.isVisible()) return "existing";
  await go("athletes");
  await page.getByRole("textbox", { name: "Nombre" }).fill("verify-prod");
  await page.getByRole("button", { name: "Crear atleta" }).click();
  await go("athlete");
  await identity.waitFor();
  return "created";
}

export function waitForUrl(page, re) {
  return expect(page).toHaveURL(re, { timeout: TIMEOUT });
}
