import { randomUUID } from "node:crypto";

import { expect } from "@playwright/test";

import { mainText, TIMEOUT } from "../browser.mjs";
import { expectOk } from "../steps.mjs";

const DELETE_ITEM = /^(Borrar|Eliminar)( entreno)?$/;
const CONFIRM = /^(Borrar|Eliminar)$/;
const NOT_FOUND = /no encontrado|no existe|not found/i;

async function deleteOnce(page, go, id) {
  await go(`workout/view/${id}`);
  await page.getByRole("button", { name: "Más opciones" }).click();
  await page.getByRole("menuitem", { name: DELETE_ITEM }).click();
  await page
    .getByRole("alertdialog")
    .or(page.getByRole("dialog"))
    .getByRole("button", { name: CONFIRM })
    .click();
}

// F-30: "Más opciones" is permanently disabled, so nothing can delete.
export async function deleteWithUndo(rec, session, id) {
  const { page, go } = session;
  await go(`workout/view/${id}`);
  const more = page.getByRole("button", { name: "Más opciones" });
  await more
    .or(page.getByText(/no encontrado/i))
    .first()
    .waitFor();
  const enabled = (await more.count()) > 0 && (await more.isEnabled());
  rec.assert(
    enabled,
    "F-30: the detail view's 'Más opciones' menu is enabled",
    `present=${await more.count()} disabled=${(await more.count()) > 0 && (await more.isDisabled())}`
  );
  if (!enabled) return;
  const card = page.getByTestId(`workout-card-${id}`);
  await deleteOnce(page, go, id);
  await page.getByRole("button", { name: /^Deshacer$/ }).click();
  await go("calendar");
  await expectOk(rec, "F-30: Undo brings the card back", () =>
    expect(card).toBeVisible({ timeout: TIMEOUT })
  );
  await deleteOnce(page, go, id);
  await go("calendar");
  await page.getByTestId("calendar-week-grid").waitFor();
  await expectOk(
    rec,
    "F-30: a deleted workout stays deleted after reload",
    () => expect(card).toHaveCount(0, { timeout: TIMEOUT })
  );
}

export async function notFound(rec, session) {
  for (const route of ["workout", "workout/view"]) {
    const { page, go } = session;
    await go(`${route}/${randomUUID()}`);
    await expectOk(
      rec,
      `F-42: #/${route}/<unknown id> says "not found" within 2 s`,
      () =>
        expect(page.locator("main")).toContainText(NOT_FOUND, {
          timeout: 2000,
        }),
      async () => `main=${(await mainText(page)) || "(empty)"}`
    );
  }
}
