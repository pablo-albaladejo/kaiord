import { exact } from "../browser.mjs";

// F-05: the empty library has no CTA. F-45: on a phone the non-AI
// "Nueva sesión" options sit under the bottom navigation. A first run shows
// the default profile's notice above both, so they must hold with it there.
const NON_AI = ["Plantilla", "En blanco", "Importar archivo"];
const LIBRARY_CTAS = [
  ["Nuevo entreno", /#\/workout\/new$/],
  ["Importar archivo", /#\/workout\/new\?action=import$/],
];

async function libraryCta(rec, open, [label, route]) {
  const { page, go } = await open();
  await go("library");
  await page.getByText("Tu biblioteca está vacía").waitFor();
  const cta = page.locator("main").getByRole("button", { name: exact(label) });
  const labels = await page.locator("main :is(button,a)").allInnerTexts();
  if (
    !rec.assert(
      (await cta.count()) === 1,
      `F-05: the empty library offers '${label}'`,
      `controls=[${labels.join(" | ")}]`
    )
  )
    return;
  await cta.click();
  await page.waitForURL(route);
  rec.assert(true, `F-05: '${label}' opens ${route.source}`);
}

async function mobileSheet(rec, open) {
  const { page, go } = await open({ mobile: true });
  await go("workout/new");
  const nav = page.getByTestId("bottom-nav");
  await nav.waitFor();
  const navTop = (await nav.boundingBox()).y;
  const notice = await page.getByTestId("default-profile-notice").count();
  for (const label of NON_AI) {
    const button = page.getByRole("button", { name: exact(label) });
    await button.waitFor({ state: "attached" });
    const box = await button.boundingBox();
    const bottom = box ? Math.round(box.y + box.height) : "none";
    rec.assert(
      box && box.y + box.height <= navTop,
      `F-45: '${label}' is above the bottom nav at 390×664 without scrolling`,
      `buttonBottom=${bottom} navTop=${Math.round(navTop)} notice=${notice}`
    );
  }
}

export default async function emptyStatesMobile({ rec, open }) {
  for (const cta of LIBRARY_CTAS) await libraryCta(rec, open, cta);
  await mobileSheet(rec, open);
}
