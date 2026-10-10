import { expect } from "@playwright/test";

import { isoDate, mainText, TIMEOUT } from "../browser.mjs";
import { ensureProfile, expectOk } from "../steps.mjs";
import { saveWellness } from "../wellness.mjs";
import { EXPORT_CONTROL, findDataControl } from "./export.mjs";

// F-41 (import half): there is no way to restore a backup file.
const IMPORT_CONTROL =
  /Importar (mis datos|copia|una copia|datos)|Restaurar( copia)?|Import (backup|my data)/i;

async function exportFrom(session, date) {
  await ensureProfile(session);
  await saveWellness(session, date, { "Weight (kg)": "68.9" });
  const control = await findDataControl(
    session.page,
    session.go,
    EXPORT_CONTROL
  );
  if (!control) throw new Error("no export control to produce a backup");
  const [download] = await Promise.all([
    session.page.waitForEvent("download"),
    control.click(),
  ]);
  return download.path();
}

export default async function backupImport({ rec, open }) {
  const target = await open();
  const { page, go } = target;
  const control = await findDataControl(page, go, IMPORT_CONTROL);
  const buttons = await page.locator("main button").allInnerTexts();
  const found = rec.assert(
    control,
    "F-41: Settings → Privacy has an 'import backup' control",
    `buttons=[${buttons.join(" | ")}] text=${await mainText(page)}`
  );
  if (!found) return;
  const date = isoDate(new Date());
  const file = await exportFrom(await open(), date);
  await findDataControl(page, go, IMPORT_CONTROL);
  await page.locator("main input[type=file]").first().setInputFiles(file);
  await go("calendar");
  const cell = page.getByTestId(`day-column-${date}`);
  await expectOk(
    rec,
    "round-trip: wellness from the backup appears in a fresh browser",
    () => expect(cell).toContainText("68.9", { timeout: TIMEOUT }),
    () => cell.innerText()
  );
}
