import { act, screen } from "@testing-library/react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { setActiveLocale } from "../i18n/i18n";
import { renderStaleBoot } from "./render-stale-boot";

describe("renderStaleBoot", () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await setActiveLocale("en");
  });

  it("should show the dialog in the browser's language without the app providers", async () => {
    // Arrange
    vi.spyOn(navigator, "language", "get").mockReturnValue("es-ES");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    // Act
    await act(() => renderStaleBoot(root));

    // Assert
    expect(
      screen.getByRole("dialog", {
        name: "Kaiord se ha actualizado en otra ventana",
      })
    ).toBeInTheDocument();
    act(() => root.unmount());
    container.remove();
  });
});
