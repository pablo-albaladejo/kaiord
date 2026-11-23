import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { healthSharingGate } from "../../../lib/health-sharing-gate";
import { healthSharingStore } from "../../../lib/health-sharing-store";
import { HealthSharingNotice } from "./HealthSharingNotice";

describe("HealthSharingNotice", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("should name the Provider and each kind of health data the assistant can send", async () => {
    // Arrange
    render(<HealthSharingNotice />);

    // Act
    act(() => {
      // Left unanswered: the notice drops it on unmount.
      healthSharingGate
        .request({
          flow: "assistant",
          providerType: "anthropic",
        })
        .catch(() => undefined);
    });

    // Assert
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Send your health data to Anthropic?");
    expect(dialog).toHaveTextContent(
      "the assistant can read this health data and send it to Anthropic: sleep, resting heart rate, weight, HRV, steps and daily calories, body composition, stress, the meals you log, and energy balance and goal."
    );
    expect(dialog).toHaveTextContent("Kaiord never receives it.");
    expect(dialog).toHaveTextContent(
      "From now on Anthropic can receive, without asking:"
    );
    expect(dialog).toHaveTextContent("lab results");
  });

  it("should keep the athlete's always-allow answer for that Provider and close", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<HealthSharingNotice />);
    let share: Promise<string> = Promise.resolve("");
    act(() => {
      share = healthSharingGate.request({
        flow: "generation",
        providerType: "openai",
      });
    });

    // Act
    await user.click(
      await screen.findByRole("button", { name: "Always allow OpenAI" })
    );

    // Assert
    await expect(share).resolves.toBe("send");
    expect(healthSharingStore.read()).toEqual({ openai: "always" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should say what don't send does for a lab document, and withhold it", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<HealthSharingNotice />);
    let share: Promise<string> = Promise.resolve("");
    act(() => {
      share = healthSharingGate.request({
        flow: "labImport",
        providerType: "google",
      });
    });
    const dialog = await screen.findByRole("dialog");

    // Act
    await user.click(screen.getByRole("button", { name: "Don't send" }));

    // Assert
    expect(dialog).toHaveTextContent(
      "The document is not sent; you can enter the results by hand. Kaiord won't ask again for Google."
    );
    await expect(share).resolves.toBe("withhold");
    expect(healthSharingStore.read()).toEqual({ google: "never" });
  });

  it("should stay open on Escape: the athlete must answer", async () => {
    // Arrange
    render(<HealthSharingNotice />);
    act(() => {
      // Left unanswered: the notice drops it on unmount.
      healthSharingGate
        .request({
          flow: "assistant",
          providerType: "google",
        })
        .catch(() => undefined);
    });
    const dialog = await screen.findByRole("dialog");

    // Act
    fireEvent.keyDown(dialog, { key: "Escape" });

    // Assert
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should take the question off the screen when the run that asked is stopped", async () => {
    // Arrange
    render(<HealthSharingNotice />);
    const stop = new AbortController();
    let share: Promise<string> = Promise.resolve("");
    act(() => {
      share = healthSharingGate.request(
        { flow: "assistant", providerType: "anthropic" },
        { signal: stop.signal }
      );
    });
    await screen.findByRole("dialog");

    // Act
    act(() => stop.abort());

    // Assert
    await expect(share).rejects.toThrow(/abort/i);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(healthSharingStore.read()).toEqual({});
  });
});
