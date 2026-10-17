import { mockLlmSuccess } from "./fixtures/api-mocks";
import { expect, test } from "./fixtures/base";

/**
 * The account overflow menu opens on press. If the page moves before the
 * release (a scroll still running), the release lands on a menu item,
 * and it must not choose it. Mobile Safari hit this in CI: Playwright pressed
 * while WebKit was still animating its scroll-into-view, and the release
 * chose Rename or Remove by itself. The test pads the body, so its own
 * scroll never depends on where Save left the page.
 */
test.describe("AI account menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await mockLlmSuccess(page);
    await page.goto("/settings/ai");
  });

  test("should not choose an item the opening press is released over", async ({
    page,
  }) => {
    // Arrange
    const settingsPage = page.getByTestId("settings-page");
    const providers = settingsPage.getByRole("list", { name: "AI accounts" });
    await settingsPage.getByRole("button", { name: "Add account" }).click();
    await settingsPage.getByLabel("Label (optional)").fill("My Claude");
    await settingsPage.getByPlaceholder("sk-...").fill("sk-ant-key-1");
    await settingsPage.getByRole("button", { name: "Save account" }).click();
    const trigger = providers.getByRole("button", {
      name: "More actions for My Claude",
    });
    await expect(settingsPage.getByLabel("Label (optional)")).toHaveCount(0);
    const settled = () =>
      trigger.evaluate(async (el) => {
        const frame = () => new Promise(requestAnimationFrame);
        const top = el.getBoundingClientRect().top;
        await frame();
        await frame();
        return el.getBoundingClientRect().top === top;
      });
    await expect.poll(settled).toBe(true);
    // The move below scrolls the window down by about one row. Where Save
    // leaves the page depends on how fast the list renders, and the page can
    // end at its bottom with no room left, so make the room and centre the
    // trigger (a centred menu opens downwards).
    await page.evaluate(() => {
      document.body.style.paddingBottom = `${window.innerHeight}px`;
    });
    await trigger.evaluate((el) =>
      el.scrollIntoView({ block: "center", behavior: "instant" })
    );
    await expect.poll(settled).toBe(true);
    const box = await trigger.boundingBox();
    if (!box) throw new Error("trigger has no box");
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const remove = page.getByRole("menuitem", { name: "Remove" });
    const removeCentre = async () => {
      const b = await remove.boundingBox();
      return b ? b.y + b.height / 2 : Number.NaN;
    };
    const underPointer = async () => {
      const b = await remove.boundingBox();
      return b !== null && Math.abs((await removeCentre()) - y) < b.height / 2;
    };

    // Act
    await page.mouse.move(x, y);
    await page.mouse.down();
    await expect(remove).toBeVisible();
    await expect.poll(removeCentre).not.toBeNaN();
    const shift = (await removeCentre()) - y;
    expect(shift).toBeGreaterThan(0);
    const moved = await page.evaluate((top) => {
      const before = window.scrollY;
      window.scrollBy({ top, behavior: "instant" });
      return window.scrollY - before;
    }, shift);
    expect(Math.abs(moved - shift)).toBeLessThan(1);
    await expect.poll(underPointer).toBe(true);
    await page.mouse.up();

    // Assert
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(remove).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(remove).toHaveCount(0);
    await expect(
      providers.getByText("My Claude", { exact: true })
    ).toBeVisible();
    await expect(providers.getByRole("textbox")).toHaveCount(0);
  });
});
