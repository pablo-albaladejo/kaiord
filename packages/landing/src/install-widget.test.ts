import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commands, setupInstallWidget } from "./install-widget";

function mountWidget(): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = `
    <div role="tablist">
      <button class="pm-tab" data-pm="npm" aria-selected="true">npm</button>
      <button class="pm-tab" data-pm="yarn" aria-selected="false">yarn</button>
      <button class="pm-tab" data-pm="pnpm" aria-selected="false">pnpm</button>
      <button class="pm-tab" data-pm="bun" aria-selected="false">bun</button>
    </div>
    <select id="pm-select">
      <option value="npm">npm</option>
      <option value="yarn">yarn</option>
    </select>
    <code id="install-cmd">npm i @kaiord/core</code>
    <button id="copy-btn">
      <svg id="copy-icon"></svg>
      <svg id="check-icon" class="hidden"></svg>
    </button>
    <span id="copy-feedback"></span>`;
  document.body.appendChild(root);
  return root;
}

describe("install widget", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("should swap the command when a package-manager tab is clicked", () => {
    // Arrange
    const root = mountWidget();
    setupInstallWidget(root);
    const pnpmTab = root.querySelector<HTMLButtonElement>('[data-pm="pnpm"]')!;

    // Act
    pnpmTab.click();

    // Assert
    expect(root.querySelector("#install-cmd")?.textContent).toBe(commands.pnpm);
    expect(pnpmTab.getAttribute("aria-selected")).toBe("true");
  });

  it("should move focus with arrow keys following the roving tab pattern", () => {
    // Arrange
    const root = mountWidget();
    setupInstallWidget(root);
    const npmTab = root.querySelector<HTMLButtonElement>('[data-pm="npm"]')!;

    // Act
    npmTab.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
    );

    // Assert
    expect(root.querySelector("#install-cmd")?.textContent).toBe(commands.yarn);
    expect(
      root.querySelector('[data-pm="yarn"]')?.getAttribute("aria-selected")
    ).toBe("true");
    expect(
      root.querySelector('[data-pm="npm"]')?.getAttribute("aria-selected")
    ).toBe("false");
    expect(root.querySelector('[data-pm="yarn"]')?.getAttribute("tabindex")).toBe(
      "0"
    );
    expect(root.querySelector('[data-pm="npm"]')?.getAttribute("tabindex")).toBe(
      "-1"
    );
  });

  it("should swap the command when the mobile select changes", () => {
    // Arrange
    const root = mountWidget();
    setupInstallWidget(root);
    const select = root.querySelector<HTMLSelectElement>("#pm-select")!;

    // Act
    select.value = "yarn";
    select.dispatchEvent(new Event("change"));

    // Assert
    expect(root.querySelector("#install-cmd")?.textContent).toBe(commands.yarn);
  });

  it("should copy the command and flip to a checkmark, then revert", async () => {
    // Arrange
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const root = mountWidget();
    setupInstallWidget(root);
    const copyBtn = root.querySelector<HTMLButtonElement>("#copy-btn")!;

    // Act
    copyBtn.click();
    await Promise.resolve();
    await Promise.resolve();

    // Assert
    expect(writeText).toHaveBeenCalledWith("npm i @kaiord/core");
    expect(root.querySelector("#copy-feedback")?.textContent).toBe("Copied!");
    expect(
      root.querySelector("#check-icon")?.classList.contains("hidden")
    ).toBe(false);
    vi.runAllTimers();
    expect(root.querySelector("#copy-feedback")?.textContent).toBe("");
    expect(
      root.querySelector("#check-icon")?.classList.contains("hidden")
    ).toBe(true);
    expect(
      root.querySelector("#copy-icon")?.classList.contains("hidden")
    ).toBe(false);
  });
});
