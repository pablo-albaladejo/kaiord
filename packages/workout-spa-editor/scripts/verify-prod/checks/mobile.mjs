import { exact } from "../browser.mjs";

// F-44 FAB covers "Biblioteca", F-46 "Nuevo entreno" cut off and the week
// pushed below the fold, F-47 tall header, F-03 font 404.
function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

const fmt = (b) =>
  b
    ? `${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}`
    : "none";

// A phone renders the week as a list; the seven-column grid only appears
// from 768 px up, so the check reads whichever view the device renders.
const weekView = (page) =>
  page
    .getByTestId("calendar-week-list")
    .or(page.getByTestId("calendar-week-grid"))
    .first();

export default async function mobile({ rec, open }) {
  const { page, go, evidence } = await open({ mobile: true });
  await go("calendar");
  await weekView(page).waitFor();
  const width = page.viewportSize().width;
  const height = page.viewportSize().height;
  const nav = page.getByTestId("bottom-nav");
  const fab = await nav
    .getByRole("button", { name: "Crear entreno" })
    .boundingBox();
  const library = await nav.getByText(exact("Biblioteca")).boundingBox();
  rec.assert(
    fab && library && !overlaps(fab, library),
    "F-44: the '+' button does not cover 'Biblioteca'",
    `fab=${fmt(fab)} label=${fmt(library)}`
  );
  const header = await page.locator("header").first().boundingBox();
  rec.assert(
    header && header.height <= 64,
    "F-47: the mobile header is at most 64 px tall",
    `header=${fmt(header)}`
  );
  const cta = await page.getByTestId("create-workout-cta").boundingBox();
  rec.assert(
    cta && cta.x + cta.width <= width,
    "F-46: 'Nuevo entreno' fits inside the viewport",
    `cta=${fmt(cta)} viewport=${width}`
  );
  const week = await weekView(page).boundingBox();
  rec.assert(
    week && week.y < height,
    "F-46: the week starts on the first screen",
    `week=${fmt(week)} viewportHeight=${height}`
  );
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  rec.assert(
    overflow <= 0,
    "no horizontal page overflow",
    `overflow=${overflow}`
  );
  const fonts = evidence.failedRequests.filter((r) => r.url.includes(".woff2"));
  rec.assert(
    fonts.length === 0,
    "F-03: no .woff2 request fails",
    fonts.map((r) => `${r.what} ${r.url}`).join(" | ")
  );
}
