import { findEnglish } from "./i18n-terms.mjs";

const RUNNING = /^(Running|Carrera)$/;
const LTHR = "170";
// Karvonen 5-zone Z1 tops out at 82% of LTHR: round(170 × 0.82).
const KARVONEN_Z1_MAX = "139";

async function openRunningThresholds(page, go) {
  await go("athlete");
  const running = page.locator("main").getByRole("radio", { name: RUNNING });
  await running.click();
  await page
    .locator("main")
    .getByRole("button", { name: "Editar", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const tab = dialog.getByRole("tab", { selected: true });
  await tab.waitFor();
  return { dialog, selected: await tab.innerText() };
}

// F-24: thresholds open on the active sport. F-25: a runner's thresholds
// lead with pace and LTHR, power is optional, the method shown is the one
// the zones were built with, saving says so, and zones are named in Spanish.
export async function thresholdChecks(rec, session) {
  const { page, go } = session;
  const { dialog, selected } = await openRunningThresholds(page, go);
  rec.assert(
    /Carrera|Running/.test(selected),
    "F-24: thresholds open on the active sport (Running)",
    `dialogTab=${selected}`
  );
  const order = await dialog
    .locator("input[aria-label^='umbral ']")
    .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
  rec.assert(
    order.join("|") === "umbral Ritmo umbral|umbral LTHR|umbral FTP",
    "F-25: running thresholds lead with pace and LTHR",
    order.join("|")
  );
  const optional = await dialog.getByTestId("threshold-optional-FTP").count();
  rec.assert(optional === 1, "F-25: FTP is optional in running", optional);
  await dialog.getByLabel("umbral LTHR").fill(LTHR);
  const status = dialog.getByRole("status").filter({ hasText: "Guardado" });
  await status.waitFor();
  rec.assert(true, "F-25: a threshold change says it was saved");
  const method = await dialog
    .getByLabel("método de zona hr")
    .evaluate((select) => select.selectedOptions[0]?.textContent ?? "");
  const z1Max = await dialog.getByLabel("FC Zona 1 máx").first().innerText();
  rec.assert(
    method === "Karvonen 5 zonas" && z1Max.includes(KARVONEN_Z1_MAX),
    "F-25: the heart-rate method shown is the one applied",
    `method=${method} z1Max=${z1Max}`
  );
  const english = findEnglish(await dialog.innerText());
  rec.assert(
    english.length === 0,
    "F-25: zone and method names are in Spanish",
    english.join(", ")
  );
  await page.keyboard.press("Escape");
}
