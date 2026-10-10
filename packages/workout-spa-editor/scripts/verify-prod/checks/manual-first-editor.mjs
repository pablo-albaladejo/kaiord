import { mainText } from "../browser.mjs";
import { nameWorkout, openBlankEditor } from "../editor.mjs";

const RUNNING = /^(Running|Carrera)$/;

// F-24: thresholds open on Cycling even when Running is the active sport.
export async function thresholdTab(rec, session) {
  const { page, go } = session;
  await go("athlete");
  const running = page.locator("main").getByRole("radio", { name: RUNNING });
  await running.click();
  const checked = await running.getAttribute("aria-checked");
  await page
    .locator("main")
    .getByRole("button", { name: "Editar", exact: true })
    .click();
  const tab = page.getByRole("dialog").getByRole("tab", { selected: true });
  await tab.waitFor();
  const selected = await tab.innerText();
  rec.assert(
    /Carrera|Running/.test(selected),
    "F-24: thresholds open on the active sport (Running)",
    `pageRadioChecked=${checked} dialogTab=${selected}`
  );
  await page.keyboard.press("Escape");
}

// F-10 metadata opens in edit mode, F-11 raw seconds and m/s, F-12 no
// intensity, F-14 the FTP banner shows for a pace-only running workout.
export async function editorChecks(rec, session) {
  const { page } = session;
  await openBlankEditor(session);
  const editing = await page.getByTestId("save-metadata-button").isVisible();
  rec.assert(
    !editing,
    "F-10: workout metadata starts read-only",
    `metadataSaveVisible=${editing}`
  );
  await nameWorkout(page, "VP pace", "running");
  await page.getByTestId("add-first-step-button").click();
  await page
    .getByText(/^(Step|Paso) \d+$/)
    .last()
    .click();
  await page
    .getByLabel(/Select duration type|Tipo de duración/)
    .selectOption("time");
  const seconds = await page.getByLabel(/Duration \(seconds\)/).count();
  rec.assert(
    seconds === 0,
    "F-11: duration is typed as mm:ss, not raw seconds",
    "field 'Duration (seconds)' present"
  );
  await page.getByLabel("Seleccionar tipo de objetivo").selectOption("pace");
  const ms = await page.getByLabel(/Ritmo \(m\/s\)/).count();
  rec.assert(
    ms === 0,
    "F-11: pace is typed as min/km, not m/s",
    "field 'Ritmo (m/s)' present"
  );
  const intensity = await page.getByLabel(/Intensidad|Intensity/).count();
  rec.assert(
    intensity > 0,
    "F-12: the step editor has an intensity selector",
    `intensityFields=${intensity}`
  );
  await page.getByLabel(/Ritmo/).first().fill("3.2");
  await page
    .getByRole("button", { name: /Cerrar el formulario del paso|^Hecho$/ })
    .click();
  const text = await mainText(page);
  const banner = text.match(/Sin FTP para[^\n]*/)?.[0];
  rec.assert(
    !banner,
    "F-14: no FTP warning for a pace-only running workout",
    banner
  );
}
