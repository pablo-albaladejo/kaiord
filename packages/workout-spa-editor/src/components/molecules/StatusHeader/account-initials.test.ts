import { describe, expect, it } from "vitest";

import { accountInitials } from "./account-initials";

describe("accountInitials", () => {
  it("should take the first letter of the first two words", () => {
    // Arrange
    const name = "Ada Byron Lovelace";

    // Act
    const initials = accountInitials(name);

    // Assert
    expect(initials).toBe("AB");
  });

  it("should uppercase a lowercase profile name", () => {
    // Arrange
    // Reachable: profile names are free text, written by `createProfile` from
    // whatever the user typed.
    const name = "test2";

    // Act
    const initials = accountInitials(name);

    // Assert
    expect(initials).toBe("T");
  });

  it("should produce no initials with no profile", () => {
    // Arrange
    // Reachable state: first run, before any profile exists. The caller
    // renders the person icon rather than a stand-in character.
    const name = null;

    // Act
    const initials = accountInitials(name);

    // Assert
    expect(initials).toBe("");
  });

  it("should produce no initials for a whitespace-only name", () => {
    // Arrange
    // Reachable: the profile-name field does not trim, so a name of spaces
    // reaches storage.
    const name = "   ";

    // Act
    const initials = accountInitials(name);

    // Assert
    expect(initials).toBe("");
  });
});
