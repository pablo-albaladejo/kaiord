import { exact, mainText } from "../browser.mjs";
import { addTimedStep, nameWorkout, openBlankEditor } from "../editor.mjs";
import { findEnglish } from "./i18n-terms.mjs";

const CLOSE_STEP = /Cerrar el formulario del paso|^Hecho$/;

async function openFirstStep(page) {
  await page.getByTestId("add-first-step-button").click();
  await page
    .getByText(/^(Step|Paso) \d+$/)
    .last()
    .click();
  return page.getByTestId("step-editor");
}

// F-10 metadata starts read-only, F-11 duration in mm:ss and pace in min/km,
// F-12 an intensity selector that starts the session with a warm-up, F-13
// a Spanish step editor, F-14 no FTP line for a pace-only running workout.
export async function editorChecks(rec, session) {
  const { page } = session;
  await openBlankEditor(session);
  const editing = await page.getByTestId("save-metadata-button").isVisible();
  rec.assert(!editing, "F-10: workout metadata starts read-only", editing);
  await nameWorkout(page, "VP pace", "running");
  const form = await openFirstStep(page);
  const intensity = await form
    .getByLabel("Selecciona la intensidad del paso")
    .inputValue();
  rec.assert(
    intensity === "warmup",
    "F-12: the first step is a warm-up",
    intensity
  );
  await form.getByLabel("Tipo de duración").selectOption("time");
  await form.getByLabel("Duración (mm:ss)").fill("3:00");
  await form.getByLabel("Seleccionar tipo de objetivo").selectOption("pace");
  await form.getByLabel("Ritmo (min/km)").fill("4:30");
  const english = findEnglish(await form.innerText());
  rec.assert(
    english.length === 0,
    "F-13: the step editor is in Spanish",
    english.join(", ")
  );
  await page.getByRole("button", { name: CLOSE_STEP }).click();
  const card = await page.getByTestId("step-card").first().innerText();
  rec.assert(
    /3 min/.test(card) && /4:30 min\/km/.test(card),
    "F-11: 3:00 at 4:30/km reads back as typed",
    card.replace(/\s+/g, " ")
  );
  const banner = await page.getByTestId("canvas-ftp-provenance").count();
  rec.assert(banner === 0, "F-14: no FTP line for a pace-only workout", banner);
}

// F-18: a session without targets has no load to report, so its library
// card shows the duration and no "0 TSS".
export async function libraryCard(rec, session) {
  const { page, go } = session;
  await openBlankEditor(session);
  await nameWorkout(page, "VP no load");
  await addTimedStep(page, 600);
  await page.getByRole("button", { name: "Guardar en la biblioteca" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Nombre del entrenamiento/).fill("VP no load");
  await dialog.getByRole("button", { name: exact("Guardar") }).click();
  await dialog.waitFor({ state: "detached" });
  await go("library");
  const card = page.locator("main").getByText("VP no load").first();
  await card.waitFor();
  const text = await mainText(page);
  const row = text.match(/VP no load[^\n]*\n?[^\n]*/)?.[0] ?? text;
  rec.assert(
    /10m/.test(row) && !/\b0 TSS/.test(row),
    "F-18: the library card shows the duration and no zero load",
    row
  );
}
