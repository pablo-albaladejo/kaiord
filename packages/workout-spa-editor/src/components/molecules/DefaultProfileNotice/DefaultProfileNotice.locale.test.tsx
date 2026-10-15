import { render, screen } from "@testing-library/react";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import type { Profile } from "../../../types/profile";
import { DefaultProfileNotice } from "./DefaultProfileNotice";

vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

const PROFILE: Profile = {
  id: "auto-es",
  name: "Mi perfil",
  linkedAccounts: [],
  origin: "auto",
};

describe("DefaultProfileNotice in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));
  beforeEach(async () => {
    await db.table("profiles").clear();
    await db.table("meta").clear();
    localStorage.clear();
  });

  it("should quote the athlete's own stored name", async () => {
    // Arrange
    await db.table<Profile>("profiles").put(PROFILE);
    await db.table("meta").put({ key: "activeProfileId", value: PROFILE.id });

    // Act
    render(
      <Router hook={memoryLocation({ path: "/calendar" }).hook}>
        <DefaultProfileNotice />
      </Router>
    );

    // Assert
    const notice = await screen.findByTestId("default-profile-notice");
    expect(notice).toHaveTextContent("Hemos creado «Mi perfil» para");
  });
});
