import { exact } from "../browser.mjs";

// F-05: the empty library has no CTA. F-45: on a phone the non-AI
// "Nueva sesión" options sit under the bottom navigation.
const LIBRARY_CTA = /Crear|Importar|Nuevo entreno/i;
const NON_AI = ["Plantilla", "En blanco", "Importar archivo"];

async function emptyLibrary(rec, open) {
  const { page, go } = await open();
  await go("library");
  await page.getByText("Tu biblioteca está vacía").waitFor();
  const cta = page
    .locator("main :is(button,a)")
    .filter({ hasText: LIBRARY_CTA });
  const labels = await page.locator("main :is(button,a)").allInnerTexts();
  rec.assert(
    (await cta.count()) > 0,
    "F-05: the empty library offers Create/Import",
    `controls=[${labels.join(" | ")}]`
  );
}

async function mobileSheet(rec, open) {
  const { page, go } = await open({ mobile: true });
  await go("workout/new");
  const nav = page.getByTestId("bottom-nav");
  await nav.waitFor();
  const navTop = (await nav.boundingBox()).y;
  for (const label of NON_AI) {
    const button = page.getByRole("button", { name: exact(label) });
    await button.waitFor({ state: "attached" });
    const box = await button.boundingBox();
    const bottom = box ? Math.round(box.y + box.height) : "none";
    rec.assert(
      box && box.y + box.height <= navTop,
      `F-45: '${label}' is above the bottom nav at 390×844`,
      `buttonBottom=${bottom} navTop=${Math.round(navTop)}`
    );
  }
}

export default async function emptyStatesMobile({ rec, open }) {
  await emptyLibrary(rec, open);
  await mobileSheet(rec, open);
}
