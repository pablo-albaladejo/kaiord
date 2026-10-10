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

export async function ensureProfile(session) {
  const { page, go } = session;
  await go("athlete");
  const create = page.getByRole("button", { name: "Crear perfil" });
  const existing = page.getByRole("button", { name: /Editar perfil/ });
  await create.or(existing).first().waitFor();
  if (!(await create.isVisible())) return "existing";
  await create.click();
  await page.getByLabel(/^(Name|Nombre)$/).fill("verify-prod");
  await page
    .getByRole("button", { name: /Create Profile|Crear perfil/ })
    .last()
    .click();
  await page.keyboard.press("Escape");
  await existing.first().waitFor();
  return "created";
}

export function waitForUrl(page, re) {
  return expect(page).toHaveURL(re, { timeout: TIMEOUT });
}
