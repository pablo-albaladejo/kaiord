import { isoDate, settledText } from "../browser.mjs";
import { scheduleOn } from "../editor.mjs";
import { ensureProfile } from "../steps.mjs";
import { editorChecks, thresholdTab } from "./manual-first-editor.mjs";

// P2 orientation: F-01, F-04, F-33, F-32, F-40 (plus the editor and
// threshold findings in manual-first-editor.mjs).
const REQUIREMENTS =
  /nada aparecerá solo|Tres cosas tienen que ser ciertas|Sin esto, la semana se queda vacía/;
const IMPOSSIBLE_STEPS = /Conecta una fuente|Envía una sesión a tu reloj/;
const MANUAL_READINESS =
  /Registrar|Añadir (bienestar|un dato|dato)|Introducir/i;
const mainCopy = () => document.querySelector("main")?.innerText ?? "";

async function firstRun(rec, open) {
  const { page, go } = await open();
  await go("calendar");
  const text = await settledText(page, mainCopy);
  rec.assert(
    !REQUIREMENTS.test(text),
    "F-01: first run does not present integrations as requirements",
    text.slice(0, 260)
  );
}

async function daily(rec, page, go) {
  await go("daily");
  const text = await settledText(page, mainCopy);
  rec.assert(
    !IMPOSSIBLE_STEPS.test(text),
    "F-33: the setup checklist only lists steps reachable without integrations",
    text.match(/Primeros pasos[\s\S]{0,200}/)?.[0] ?? text.slice(0, 200)
  );
  const card =
    text.match(/Aún no hay datos de preparación[\s\S]{0,120}/)?.[0] ?? "";
  const manual = await page
    .locator("main :is(button,a)")
    .filter({ hasText: MANUAL_READINESS })
    .count();
  rec.assert(
    !card || manual > 0,
    "F-04: the readiness card offers manual entry",
    `card=${card} manualControls=${manual}`
  );
}

async function plannedSource(rec, session) {
  const { page, go } = session;
  await scheduleOn(session, isoDate(new Date()), "VP manual planned");
  await page.getByLabel(/Next week|Semana siguiente/).click();
  const week = await settledText(page, mainCopy);
  rec.assert(
    !/entrenador/i.test(week),
    "F-32: an empty week does not assume a coach",
    week.slice(0, 260)
  );
  await go("settings/connections");
  const text = await settledText(page, mainCopy);
  const row =
    text.match(/Sesión planificada[\s\S]{0,90}/)?.[0] ?? "(row missing)";
  rec.assert(
    !/Sin fuente/.test(row),
    "F-40: a manually scheduled session counts as a planned-session source",
    row
  );
}

export default async function manualFirst({ rec, open }) {
  await firstRun(rec, open);
  const session = await open();
  await ensureProfile(session);
  await daily(rec, session.page, session.go);
  await plannedSource(rec, session);
  await thresholdTab(rec, session);
  await editorChecks(rec, session);
}
