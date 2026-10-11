import { isoDate } from "../browser.mjs";
import { windowDayOffsets } from "../dates.mjs";
import { ensureProfile } from "../steps.mjs";
import { saveWellness } from "../wellness.mjs";

// F-36: one data point in a 90-day window must still draw the 90-day window,
// not an axis that runs years into the future, and the legend must not read
// "Time --". uPlot paints its axes on a canvas, so the tick labels are
// captured from CanvasRenderingContext2D.
function recordCanvasText() {
  window.__vpDrawn = [];
  const original = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (text, ...rest) {
    window.__vpDrawn.push(String(text));
    return original.call(this, text, ...rest);
  };
}

const WINDOW_DAYS = 90;
const EDGE_DAYS = 31;
const DATE_TICK = /^\d{1,2} \p{L}{3,5}\.?$/u;

async function drawWeightChart(session, today) {
  const { page, go } = session;
  await saveWellness(session, isoDate(today), { weight: "70.2" });
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
  return chart;
}

export default async function trends({ rec, open }) {
  const session = await open();
  await session.ctx.addInitScript(recordCanvasText);
  await ensureProfile(session);
  const today = new Date();
  const chart = await drawWeightChart(session, today);
  const drawn = await session.page.evaluate(() => window.__vpDrawn);
  const days = await windowDayOffsets(session.page, today, WINDOW_DAYS);
  const ticks = drawn.filter((t) => DATE_TICK.test(t));
  const offsets = ticks.map((t) => days.get(t));
  const inside = offsets.filter((o) => o !== undefined);
  rec.assert(
    ticks.length >= 2 && inside.length === ticks.length,
    `F-36: every date tick falls inside the ${WINDOW_DAYS}-day window`,
    `ticks=[${drawn.join(", ")}]`
  );
  rec.assert(
    inside.length > 0 &&
      Math.min(...inside) < EDGE_DAYS &&
      Math.max(...inside) >= WINDOW_DAYS - EDGE_DAYS,
    "F-36: the x-axis runs from the window's start to today, not around the one point",
    `offsets=[${offsets.join(", ")}]`
  );
  const legend = await chart.locator(".u-legend").innerText();
  rec.assert(
    !/Time/.test(legend) && /Fecha/.test(legend),
    "F-36: the legend names the date series 'Fecha', not 'Time'",
    `legend=${legend}`
  );
}
