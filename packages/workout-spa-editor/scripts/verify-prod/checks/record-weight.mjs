// The current weight is a weigh-in recorded from the Athlete page's Body
// section, whose first number field it is (P-03).
export async function recordWeight(page) {
  await page.evaluate(() => (window.location.hash = "#/athlete?section=body"));
  const weight = page.locator("#body").locator('input[type="number"]').first();
  await weight.fill("70");
  await weight.press("Enter");
  // The status line fills ("Guardado") once the weigh-in is written.
  await page.locator('#body [role="status"]:not(:empty)').waitFor();
}
