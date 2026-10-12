import { TIMEOUT } from "../browser.mjs";
import { addTimedStep, nameWorkout, openBlankEditor } from "../editor.mjs";
import { localeText } from "../locale.mjs";

const TRIGGER = "export-format-selector-button";
const option = (format) => `export-format-option-${format}`;

// F-15: the format menu's trigger is the one download control, and a lossy
// format's warning sits inside its option, read before anything downloads.
async function assertSingleControl(rec, page, downloads) {
  const trigger = page.getByTestId(TRIGGER);
  const icons = page.locator("button:has(svg.lucide-download)");
  const triggerIcons = await trigger.locator("svg.lucide-download").count();
  rec.assert(
    (await icons.count()) === 1 && triggerIcons === 1,
    "F-15: the format menu's trigger is the editor's only download control",
    `download buttons=${await icons.count()} on trigger=${triggerIcons}`
  );
  await trigger.click();
  const fit = page.getByTestId(option("fit"));
  const note = fit.getByRole("note");
  const noteId = (await note.count()) ? await note.getAttribute("id") : null;
  rec.assert(
    noteId !== null &&
      (await note.isVisible()) &&
      (await fit.getAttribute("aria-describedby")) === noteId &&
      (await page.getByTestId(option("krd")).getByRole("note").count()) === 0,
    "F-15: the FIT option shows its lossy-format warning before the pick",
    `note=${noteId} describedby=${await fit.getAttribute("aria-describedby")}`
  );
  rec.assert(
    downloads.length === 0,
    "F-15: opening the menu downloads nothing"
  );
}

async function pickFit(page) {
  const download = page.waitForEvent("download", { timeout: TIMEOUT });
  if (!(await page.getByTestId(option("fit")).isVisible()))
    await page.getByTestId(TRIGGER).click();
  await page.getByTestId(option("fit")).click();
  return (await download.catch(() => null))?.suggestedFilename() ?? null;
}

// F-16: accents fold to their base letter, and a name with nothing
// printable falls back to "workout".
async function assertFilename(rec, page, name, expected) {
  await nameWorkout(page, name);
  const filename = await pickFit(page);
  rec.assert(
    filename === expected,
    `F-15/F-16: picking FIT downloads "${name}" as ${expected}`,
    `downloaded=${filename}`
  );
  const toast = localeText("es", "editor", "save.savedDescription");
  const shown = toast.replace("{{filename}}", expected);
  const toastShown = await page
    .getByText(shown)
    .first()
    .waitFor()
    .then(
      () => true,
      () => false
    );
  rec.assert(toastShown, `F-15: the toast reads "${shown}"`);
}

export async function workoutDownload({ rec, open }) {
  const session = await open();
  const { page } = session;
  const downloads = [];
  page.on("download", (d) => downloads.push(d));
  await openBlankEditor(session, { sport: /^(Running|Carrera)$/ });
  await nameWorkout(page, "Rodaje auditoría ñandú");
  await addTimedStep(page, 600);
  await assertSingleControl(rec, page, downloads);
  await assertFilename(
    rec,
    page,
    "Rodaje auditoría ñandú",
    "rodaje_auditoria_nandu.fit"
  );
  await assertFilename(rec, page, "¡¿?!", "workout.fit");
}
