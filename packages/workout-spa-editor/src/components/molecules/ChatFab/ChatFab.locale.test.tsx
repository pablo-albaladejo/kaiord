import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { ChatFab } from "./ChatFab";

vi.mock("wouter", () => ({ useLocation: () => ["/calendar", vi.fn()] }));
vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

describe("ChatFab in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should name the chat button in Spanish", () => {
    // Arrange

    // Act
    render(<ChatFab />);

    // Assert
    const fab = screen.getByRole("button", { name: "Abrir asistente de chat" });
    expect(fab).toHaveAttribute("title", "Asistente de chat");
  });
});
