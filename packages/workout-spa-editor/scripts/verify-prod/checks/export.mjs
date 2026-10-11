import { readFile } from "node:fs/promises";

import { isoDate, mainText } from "../browser.mjs";
import { INTAKE_KCAL, seed } from "./export-seed.mjs";

// F-41: there is no way to export "all my data" from Settings → Privacy.
export const EXPORT_CONTROL =
  /Exportar (mis|todos (mis|los)) datos|Exportar copia|Descargar (una )?copia|Export (my|all) data/i;
const FORBIDDEN = ["apiKey", '"origin":"auto"', "syncState"];

export async function findDataControl(page, go, pattern) {
  await go("settings/privacy");
  await page.getByText("Información de privacidad").waitFor();
  const control = page
    .locator("main :is(button,a,[role=button])")
    .filter({ hasText: pattern });
  return (await control.count()) > 0 ? control.first() : null;
}

function assertFile(rec, body, workoutName) {
  for (const needle of FORBIDDEN) {
    rec.assert(!body.includes(needle), `export file has no ${needle}`);
  }
  const backup = JSON.parse(body);
  rec.assert(
    backup.format === "kaiord-backup" && backup.version === 1,
    "export file declares format kaiord-backup, version 1",
    body.slice(0, 200)
  );
  const profiles = backup.tables?.profiles ?? [];
  rec.assert(
    profiles.length > 0 && profiles.every((p) => p.origin !== "auto"),
    "every exported profile is a real one",
    JSON.stringify(profiles)
  );
  rec.assert(
    JSON.stringify(backup.tables?.workouts ?? []).includes(workoutName),
    "export file contains the scheduled workout",
    `workouts=${backup.tables?.workouts?.length ?? 0}`
  );
  rec.assert(
    (backup.nutrition?.intakeEntries ?? []).some((e) => e.kcal === INTAKE_KCAL),
    "export file contains the logged intake",
    JSON.stringify(backup.nutrition?.intakeEntries ?? [])
  );
}

export default async function exportData({ rec, open }) {
  const session = await open();
  const { page, go } = session;
  const control = await findDataControl(page, go, EXPORT_CONTROL);
  const buttons = await page.locator("main button").allInnerTexts();
  if (
    !rec.assert(
      control,
      "F-41: Settings → Privacy has an 'export my data' control",
      `buttons=[${buttons.join(" | ")}] text=${await mainText(page)}`
    )
  ) {
    return;
  }
  const workoutName = `verify export ${Date.now()}`;
  await seed(session, isoDate(new Date()), workoutName);
  const exportControl = await findDataControl(page, go, EXPORT_CONTROL);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    exportControl.click(),
  ]);
  const body = await readFile(await download.path(), "utf8");
  assertFile(rec, body, workoutName);
}
