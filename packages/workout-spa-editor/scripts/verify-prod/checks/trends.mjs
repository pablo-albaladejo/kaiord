import { isoDate } from "../browser.mjs";
import { ensureProfile } from "../steps.mjs";
import { saveWellness } from "../wellness.mjs";

// F-36: one data point in a 90-day window draws an x-axis that runs years
// into the future, and the legend reads "Time --". uPlot paints its axes on
// a canvas, so the tick labels are captured from CanvasRenderingContext2D.
function recordCanvasText() {
  window.__vpDrawn = [];
  const original = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (text, ...rest) {
    window.__vpDrawn.push(String(text));
    return original.call(this, text, ...rest);
  };
}

export default async function trends({ rec, open }) {
  const session = await open();
  const { page, go, ctx } = session;
  await ctx.addInitScript(recordCanvasText);
  await ensureProfile(session);
  const today = new Date();
  await saveWellness(session, isoDate(today), { "Weight (kg)": "70.2" });
  await go("health");
  await page
    .locator("main")
    .getByRole("button", { name: "Peso", exact: true })
    .click();
  await page.getByRole("radio", { name: "90d" }).click();
  const chart = page.getByTestId("trend-single-chart-card");
  await chart.waitFor();
  await page.waitForFunction(() =>
    window.__vpDrawn.some((t) => / kg$/.test(t))
  );
  const drawn = await page.evaluate(() => window.__vpDrawn);
  const years = drawn.filter((t) => /^(19|20)\d\d$/.test(t)).map(Number);
  const start = new Date(today);
  start.setDate(start.getDate() - 90);
  const allowed = [start.getFullYear(), today.getFullYear()];
  const outside = years.filter((y) => y < allowed[0] || y > allowed[1]);
  rec.assert(
    outside.length === 0,
    `F-36: x-axis ticks stay inside the 90-day window (${allowed.join("–")})`,
    `ticks=[${drawn.join(", ")}]`
  );
  const legend = await chart.locator(".u-legend").innerText();
  rec.assert(
    !/Time\s*-{2}/.test(legend),
    "F-36: the legend does not read 'Time --'",
    `legend=${legend}`
  );
}
