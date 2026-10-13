import { findEnglish } from "./i18n-terms.mjs";

const RUNNING = /^(Running|Carrera)$/;
const LTHR = "170";
// Karvonen 5-zone Z1 tops out at 82% of LTHR: round(170 × 0.82).
const KARVONEN_Z1_MAX = "139";
const RUNNING_ORDER = [
  "Ritmo umbral (min/km)",
  "LTHR (ppm)",
  "FTP (W)",
  "Frecuencia cardiaca máxima (ppm)",
];

async function inlineThresholds(rec, page, go) {
  await go("athlete");
  await page.locator("main").getByRole("radio", { name: RUNNING }).click();
  const card = page.getByTestId("athlete-thresholds");
  await card.getByLabel(RUNNING_ORDER[0]).waitFor();
  const order = await card
    .locator("input")
    .evaluateAll((els) =>
      els.map((el) => el.labels?.[0]?.innerText.trim()).filter(Boolean)
    );
  rec.assert(
    order.join("|") === RUNNING_ORDER.join("|"),
    "F-25: running thresholds lead with pace and LTHR, edited in place",
    order.join("|")
  );
  const optional = await card.getByText("Opcional en carrera").count();
  rec.assert(optional === 1, "F-25: FTP is optional in running", optional);
  const lthr = card.getByLabel(RUNNING_ORDER[1]);
  await lthr.fill(LTHR);
  await lthr.press("Enter");
  await card.getByRole("status").filter({ hasText: "Guardado" }).waitFor();
  rec.assert(true, "F-25: a threshold change says it was saved");
}

// F-24: "Ajustar zonas" opens the zone editor on the active sport, at its
// own address. F-25: a runner's thresholds lead with pace and LTHR, power is
// optional, saving says so, the method shown is the one the zones were built
// with, and zones are named in Spanish.
export async function thresholdChecks(rec, session) {
  const { page, go } = session;
  await inlineThresholds(rec, page, go);
  await page.getByRole("link", { name: "Ajustar zonas" }).click();
  await page.waitForURL(/#\/athlete\/zones\/running$/);
  const editor = page.locator("main");
  const selected = await editor
    .getByRole("tab", { selected: true })
    .innerText();
  rec.assert(
    /Carrera/.test(selected) && page.url().endsWith("#/athlete/zones/running"),
    "F-24: the zone editor opens on the active sport (Running)",
    `url=${page.url()} tab=${selected}`
  );
  const method = await editor
    .getByLabel("método de zona hr")
    .evaluate((select) => select.selectedOptions[0]?.textContent ?? "");
  const z1Max = await editor.getByLabel("FC Zona 1 máx").first().innerText();
  rec.assert(
    method === "Karvonen 5 zonas" && z1Max.includes(KARVONEN_Z1_MAX),
    "F-25: the heart-rate method shown is the one applied",
    `method=${method} z1Max=${z1Max}`
  );
  const english = findEnglish(await editor.innerText());
  rec.assert(
    english.length === 0,
    "F-25: zone and method names are in Spanish",
    english.join(", ")
  );
}
