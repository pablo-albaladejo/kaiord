import { localeText } from "../locale.mjs";

const es = (key) => localeText("es", "nutrition", key);

// F-38: "Save preset" stays on offer right after the entry is added, so a
// meal can be logged first and kept as a preset second.
export default async function intakePreset({ rec, open }) {
  const { page, go } = await open();
  await go("nutrition");
  const logger = page.getByTestId("intake-logger");
  const savePreset = logger.getByTestId("intake-save-preset");
  const label = `verify preset ${Date.now()}`;
  await logger.getByLabel(es("logger.energy")).fill("512");
  await logger.getByLabel(es("logger.label"), { exact: true }).fill(label);
  await logger.getByTestId("intake-log-submit").click();
  // The toast follows the write, so the entry is in IndexedDB from here on.
  await page.getByText(es("toast.entryLogged"), { exact: true }).waitFor();
  const text = (await savePreset.innerText()).trim();
  rec.assert(
    text === es("logger.savePreset"),
    "F-38: the save-preset control is translated",
    `text="${text}"`
  );
  if (
    !rec.assert(
      await savePreset.isEnabled(),
      "F-38: save preset stays enabled right after adding the entry"
    )
  )
    return;
  await savePreset.click();
  const row = page.getByTestId("intake-preset-row").filter({ hasText: label });
  const saved = await row.waitFor().then(
    () => true,
    () => false
  );
  rec.assert(saved, "F-38: the just-added entry is saved as a preset");
}
