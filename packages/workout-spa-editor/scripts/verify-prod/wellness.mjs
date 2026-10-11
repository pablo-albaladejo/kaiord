import { TIMEOUT } from "./browser.mjs";

export const SAVE = /^(Save|Guardar)$/;

export async function openWellnessDialog(session, date) {
  const { page, go } = session;
  await go("calendar");
  await page
    .getByTestId(`empty-day-${date}`)
    .or(page.getByTestId(`calendar-list-add-${date}`))
    .first()
    .click();
  await page.getByTestId("add-entry-choose-wellness").click();
  const dialog = page.getByTestId("wellness-entry-dialog");
  await dialog.waitFor();
  return dialog;
}

// The field's `data-wellness-focus` key, not its label: labels are
// translated, and verify-prod runs in es-ES.
export const wellnessField = (dialog, key) =>
  dialog.locator(`[data-wellness-focus="${key}"]`);

export async function saveWellness(session, date, fields) {
  const dialog = await openWellnessDialog(session, date);
  for (const [key, value] of Object.entries(fields)) {
    await wellnessField(dialog, key).fill(value);
  }
  await dialog.getByRole("button", { name: SAVE }).click();
  await dialog.waitFor({ state: "hidden", timeout: TIMEOUT });
}
