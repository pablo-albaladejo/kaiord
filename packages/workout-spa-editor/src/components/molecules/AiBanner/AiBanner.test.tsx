import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import { AiBanner } from "./AiBanner";

function setGenerationStatus(status: "idle" | "success") {
  return act(async () => {
    useAiRuntimeStore.setState({ generation: { status } });
  });
}

function renderBanner() {
  const { hook } = memoryLocation({ path: "/workout/new", record: true });
  return render(
    <Router hook={hook}>
      <AiBanner />
    </Router>
  );
}

describe("AiBanner", () => {
  beforeEach(() => {
    useAiRuntimeStore.setState({ generation: { status: "idle" } });
  });

  it("should render closed by default", () => {
    // Arrange

    // Act

    renderBanner();

    // Assert

    expect(
      screen.getByRole("button", { name: /generate with ai/i })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("should expand when the header chip is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    renderBanner();

    // Act

    await user.click(screen.getByRole("button", { name: /generate with ai/i }));

    // Assert

    expect(
      screen.getByRole("button", { name: /generate with ai/i })
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("should auto-collapse after the AI generation reports success once", async () => {
    // Arrange

    const user = userEvent.setup();
    renderBanner();
    await user.click(screen.getByRole("button", { name: /generate with ai/i }));

    // Act

    await setGenerationStatus("success");

    // Assert

    expect(
      screen.getByRole("button", { name: /generate with ai/i })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("should NOT auto-collapse on subsequent success events without a fresh expand", async () => {
    // Arrange

    const user = userEvent.setup();
    renderBanner();
    await user.click(screen.getByRole("button", { name: /generate with ai/i }));
    await setGenerationStatus("success");

    // Act

    await setGenerationStatus("idle");
    await setGenerationStatus("success");

    // Assert

    expect(
      screen.getByRole("button", { name: /generate with ai/i })
    ).toHaveAttribute("aria-expanded", "false");
  });
});
