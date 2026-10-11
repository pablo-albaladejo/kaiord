import { expect } from "@playwright/test";

import { isoDate, mainText, TIMEOUT } from "../browser.mjs";
import { expectOk } from "../steps.mjs";
import {
  exportFile,
  IMPORT_CONTROL,
  importFile,
  readStore,
} from "./backup-import-steps.mjs";
import { findDataControl } from "./export.mjs";
import { INTAKE_KCAL, seed } from "./export-seed.mjs";
import { deleteOnce } from "./scheduled-lifecycle-steps.mjs";

const NOT_RESTORED =
  /1 borrados? después de la copia|1 deleted after the backup/;

async function assertRestored(rec, target, workoutName) {
  const profiles = await readStore(target.page, "profiles");
  rec.assert(
    profiles.length === 1 && profiles[0].origin !== "auto",
    "a clean browser ends with the backup's one real profile",
    JSON.stringify(profiles)
  );
  const workouts = await readStore(target.page, "workouts");
  rec.assert(
    workouts.some((w) => JSON.stringify(w).includes(workoutName)),
    "the scheduled workout is restored",
    `workouts=${workouts.length}`
  );
  const intakes = await readStore(target.page, "intakeEntries");
  rec.assert(
    intakes.some((e) => e.kcal === INTAKE_KCAL),
    "the logged intake is restored",
    JSON.stringify(intakes)
  );
  const weights = await readStore(target.page, "healthWeight");
  rec.assert(weights.length === 1, "the wellness value is restored", weights);
  await target.go("settings/ai");
  await expectOk(rec, "the restored AI provider asks for its key", () =>
    expect(target.page.getByText("Falta la clave")).toBeVisible({
      timeout: TIMEOUT,
    })
  );
}

async function deleteThenImport(rec, source, file, id) {
  await deleteOnce(source.page, source.go, id);
  const summary = await importFile(source, file);
  rec.assert(
    NOT_RESTORED.test(summary),
    "the summary counts the workout deleted after the backup",
    summary
  );
  const workouts = await readStore(source.page, "workouts");
  rec.assert(
    !workouts.some((w) => w.id === id),
    "a workout deleted after the backup stays deleted",
    `ids=${workouts.map((w) => w.id).join(",")}`
  );
}

// F-41 (import half): a backup file restores into a clean browser, and a
// delete made after the backup survives importing it.
export default async function backupImport({ rec, open }) {
  const target = await open();
  const control = await findDataControl(target.page, target.go, IMPORT_CONTROL);
  const found = rec.assert(
    control,
    "F-41: Settings → Privacy has an 'import backup' control",
    `text=${await mainText(target.page)}`
  );
  if (!found) return;
  const source = await open();
  const workoutName = `verify import ${Date.now()}`;
  const { id } = await seed(source, isoDate(new Date()), workoutName);
  const file = await exportFile(source);
  const summary = await importFile(target, file);
  rec.assert(true, `the import reports a summary: ${summary}`);
  await assertRestored(rec, target, workoutName);
  await deleteThenImport(rec, source, file, id);
}
