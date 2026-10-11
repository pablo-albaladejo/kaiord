import { totalSteps } from "../editor.mjs";
import { FIXTURES } from "../steps.mjs";

// F-22: @kaiord/tcx drops Repeat_t blocks silently.
export default async function tcxRepeat({ rec, open }) {
  const { page, go } = await open();
  const warnings = [];
  page.on("console", (m) => {
    if (/repetition|repeat/i.test(m.text())) warnings.push(m.text());
  });
  await go("workout/new?action=import");
  await page
    .getByTestId("file-upload-input")
    .setInputFiles(`${FIXTURES}tcx/WorkoutRepeatBlocks.tcx`);
  await page
    .getByText(/^Pasos totales:?$/)
    .first()
    .waitFor();
  const blocks = await page.getByTestId("repetition-block-card").count();
  rec.assert(
    blocks > 0,
    "F-22: the imported TCX shows a repetition block",
    `blocks=${blocks} steps=${await totalSteps(page)} console=[${warnings.join(" | ")}]`
  );
}
