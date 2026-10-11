import { scheduleOn } from "../editor.mjs";
import { openWellnessDialog, SAVE } from "../wellness.mjs";

export const INTAKE_KCAL = 437;

// A workout, a wellness value, an intake and an AI provider with a fake key,
// all entered through the UI of a clean browser (default profile, unclaimed).
export async function seed(session, date, workoutName) {
  const { page, go } = session;
  const wellness = await openWellnessDialog(session, date);
  await wellness.getByLabel(/Weight \(kg\)|Peso \(kg\)/).fill("69.4");
  await wellness.getByRole("button", { name: SAVE }).click();
  await wellness.waitFor({ state: "hidden" });
  await scheduleOn(session, date, workoutName);
  await go("nutrition");
  await page.getByLabel("Energía (kcal)").fill(String(INTAKE_KCAL));
  await page.getByTestId("intake-log-submit").click();
  await page.getByText("Entrada registrada", { exact: true }).waitFor();
  await go("settings/ai");
  await page.getByLabel("Etiqueta").fill("verify-prod");
  await page.getByLabel("Clave de API").fill("sk-verify-prod-fake");
  await page.getByRole("button", { name: "Añadir proveedor" }).click();
  await page.getByText("verify-prod").first().waitFor();
}
