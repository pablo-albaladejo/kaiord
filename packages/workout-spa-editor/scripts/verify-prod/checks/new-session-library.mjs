import { exact, isoDate } from "../browser.mjs";
import { nameWorkout, openBlankEditor } from "../editor.mjs";
import { expectOk } from "../steps.mjs";

// F-17 the keep dialog's name was empty; F-19/F-20 the schedule dialog was
// in English, proposed no date and silently ignored an empty one.
export async function libraryDialogs(rec, session) {
  const { page, go } = session;
  await openBlankEditor(session);
  await nameWorkout(page, "VP keep");
  await page.getByRole("button", { name: "Guardar en la biblioteca" }).click();
  const name = page.getByRole("dialog").getByLabel(/Nombre del entrenamiento/);
  const proposed = await name.inputValue();
  rec.assert(proposed === "VP keep", "F-17: keep proposes the name", proposed);
  await name.fill("VP keep");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Guardar" })
    .click();
  await go("library");
  await page
    .getByRole("button", { name: exact("Programar") })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  const title = await dialog.getByRole("heading").first().innerText();
  rec.assert(title === "Programar entreno", "F-19: dialog in Spanish", title);
  const input = page.getByTestId("schedule-date-input");
  const today = isoDate(new Date());
  const value = await input.inputValue();
  rec.assert(value === today, "F-20: the dialog proposes today", value);
  await input.fill("");
  // Bilingual on purpose: an English dialog (F-19) must still reach F-20.
  const confirm = /^\s*(Programar|Schedule)\s*$/;
  await dialog.getByRole("button", { name: confirm }).click();
  await expectOk(
    rec,
    "F-20: an empty date is explained inline",
    () => dialog.getByRole("alert").waitFor(),
    async () => (await dialog.innerText()).slice(0, 200)
  );
}
