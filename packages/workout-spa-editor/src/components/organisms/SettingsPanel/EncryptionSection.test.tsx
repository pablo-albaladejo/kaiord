import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import {
  clearSyncPassphrase,
  getSyncPassphrase,
} from "../../../lib/cloud-sync/encryption-runtime";
import { isEncryptionEnabled } from "../../../lib/cloud-sync/sync-encryption-pref";
import { EncryptionSection } from "./EncryptionSection";

afterEach(() => {
  localStorage.clear();
  clearSyncPassphrase();
});

describe("EncryptionSection", () => {
  it("should default the encryption toggle to off", () => {
    // Arrange

    // Act
    render(<EncryptionSection hasAiKeys={false} />);

    // Assert
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByLabelText(/passphrase/i)).not.toBeInTheDocument();
  });

  it("should persist the toggle and reveal the passphrase field when enabled", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<EncryptionSection hasAiKeys={false} />);

    // Act
    await user.click(screen.getByRole("switch"));

    // Assert
    expect(isEncryptionEnabled()).toBe(true);
    expect(screen.getByLabelText(/passphrase/i)).toBeInTheDocument();
  });

  it("should store the entered passphrase in the in-memory runtime", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<EncryptionSection hasAiKeys={false} />);
    await user.click(screen.getByRole("switch"));

    // Act
    await user.type(screen.getByLabelText(/passphrase/i), "correct horse");

    // Assert
    expect(getSyncPassphrase()).toBe("correct horse");
  });

  it("should show the one-time plaintext warning when AI keys exist and encryption is off", () => {
    // Arrange

    // Act
    render(<EncryptionSection hasAiKeys={true} />);

    // Assert
    expect(screen.getByTestId("plaintext-warning")).toBeInTheDocument();
  });

  it("should not show the plaintext warning a second time", () => {
    // Arrange
    const first = render(<EncryptionSection hasAiKeys={true} />);
    expect(screen.getByTestId("plaintext-warning")).toBeInTheDocument();
    first.unmount();

    // Act
    render(<EncryptionSection hasAiKeys={true} />);

    // Assert
    expect(screen.queryByTestId("plaintext-warning")).not.toBeInTheDocument();
  });

  it("should not show the plaintext warning when there are no AI keys", () => {
    // Arrange

    // Act
    render(<EncryptionSection hasAiKeys={false} />);

    // Assert
    expect(screen.queryByTestId("plaintext-warning")).not.toBeInTheDocument();
  });
});
