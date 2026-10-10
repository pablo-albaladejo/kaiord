import { readFile } from "node:fs/promises";

import { mainText } from "../browser.mjs";

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

export default async function exportData({ rec, open }) {
  const { page, go } = await open();
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
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    control.click(),
  ]);
  const body = await readFile(await download.path(), "utf8");
  for (const needle of FORBIDDEN) {
    rec.assert(
      !body.includes(needle),
      `export file has no ${needle}`,
      `file=${download.suggestedFilename()}`
    );
  }
  rec.assert(
    body.includes("kaiord-backup"),
    "export file declares format kaiord-backup",
    body.slice(0, 200)
  );
}
