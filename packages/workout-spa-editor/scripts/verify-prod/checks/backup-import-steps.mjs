import { expect } from "@playwright/test";

import { TIMEOUT } from "../browser.mjs";
import { EXPORT_CONTROL, findDataControl } from "./export.mjs";

export const IMPORT_CONTROL =
  /Importar (mis datos|copia|una copia|datos)|Restaurar( copia)?|Import (backup|my data)/i;
const SUMMARY = /Copia importada|Backup imported/;

// Reads one object store of the app's database straight from IndexedDB, so
// the check sees what was written, not what the page still shows.
export function readStore(page, store) {
  return page.evaluate(
    (name) =>
      new Promise((resolve, reject) => {
        const req = window.indexedDB.open("kaiord-spa");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const all = db.transaction(name).objectStore(name).getAll();
          all.onsuccess = () => {
            db.close();
            resolve(all.result);
          };
          all.onerror = () => reject(all.error);
        };
      }),
    store
  );
}

export async function exportFile(session) {
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

// Imports `file` and returns the summary the page shows once the import has
// written: nothing may reload before it appears (#1335).
export async function importFile(session, file) {
  const { page, go } = session;
  await findDataControl(page, go, IMPORT_CONTROL);
  await page.locator("main input[type=file]").first().setInputFiles(file);
  const status = page.getByRole("status").filter({ hasText: SUMMARY });
  await expect(status).toBeVisible({ timeout: TIMEOUT });
  return status.innerText();
}
