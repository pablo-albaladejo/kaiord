// @vitest-environment jsdom
//
// Kaiord Bridge Core — vendored unit tests for bridge-theme.js.
// Master: packages/_shared/bridge-core/test/bridge-theme.test.js. Never edit a
// vendored copy — edit the master and run `pnpm bridge:sync`. Every bridge
// runs this suite against its own vendored copy, so a drifted copy fails
// where it is used rather than only in the parity guard.
import { beforeEach, describe, expect, it } from "vitest";

const {
  KD_THEME_KEY,
  THEME_PREFERENCES,
  isThemePreference,
  storeThemePreference,
  applyThemePreference,
  readThemeMirror,
  syncPopupTheme,
} = require("../bridge-theme.js");

const root = () => document.documentElement;

beforeEach(() => {
  globalThis.__resetChromeMock();
  localStorage.clear();
  delete root().dataset.theme;
});

describe("isThemePreference", () => {
  it.each(["light", "dark", "system"])("should accept %s", (value) => {
    // Arrange
    const candidate = value;

    // Act
    const result = isThemePreference(candidate);

    // Assert
    expect(result).toBe(true);
  });

  it.each([undefined, null, "", "Light", "auto", 1, { theme: "dark" }])(
    "should reject %s",
    (value) => {
      // Arrange
      const candidate = value;

      // Act
      const result = isThemePreference(candidate);

      // Assert
      expect(result).toBe(false);
    }
  );

  it("should list exactly the three app preferences", () => {
    // Arrange
    const expected = ["light", "dark", "system"];

    // Act
    const actual = [...THEME_PREFERENCES];

    // Assert
    expect(actual).toEqual(expected);
  });
});

describe("storeThemePreference", () => {
  it("should write a valid preference to chrome.storage.local", async () => {
    // Arrange
    const theme = "light";

    // Act
    const result = await storeThemePreference(theme);

    // Assert
    expect(result).toBeNull();
    expect(globalThis.__chromeLocalStore[KD_THEME_KEY]).toBe("light");
  });

  it("should reject an unknown value as non-retryable without writing", async () => {
    // Arrange
    globalThis.__chromeLocalStore[KD_THEME_KEY] = "dark";

    // Act
    const attempt = storeThemePreference("<script>");

    // Assert
    await expect(attempt).rejects.toMatchObject({
      message: "Invalid theme preference",
      retryable: false,
    });
    expect(globalThis.__chromeLocalStore[KD_THEME_KEY]).toBe("dark");
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });
});

describe("applyThemePreference", () => {
  it.each(["light", "dark"])(
    "should set data-theme for an explicit %s preference",
    (theme) => {
      // Arrange
      const el = root();

      // Act
      applyThemePreference(theme, el);

      // Assert
      expect(el.dataset.theme).toBe(theme);
    }
  );

  it.each(["system", null, undefined, "bogus"])(
    "should remove data-theme for %s so the OS scheme applies",
    (theme) => {
      // Arrange
      const el = root();
      el.dataset.theme = "dark";

      // Act
      applyThemePreference(theme, el);

      // Assert
      expect(el.hasAttribute("data-theme")).toBe(false);
    }
  );
});

describe("syncPopupTheme", () => {
  it("should apply the stored light preference and mirror it", async () => {
    // Arrange
    globalThis.__chromeLocalStore[KD_THEME_KEY] = "light";

    // Act
    const theme = await syncPopupTheme(root());

    // Assert
    expect(theme).toBe("light");
    expect(root().dataset.theme).toBe("light");
    expect(readThemeMirror()).toBe("light");
  });

  it("should apply the stored dark preference", async () => {
    // Arrange
    globalThis.__chromeLocalStore[KD_THEME_KEY] = "dark";

    // Act
    await syncPopupTheme(root());

    // Assert
    expect(root().dataset.theme).toBe("dark");
  });

  it("should follow the OS scheme when the preference is system", async () => {
    // Arrange
    globalThis.__chromeLocalStore[KD_THEME_KEY] = "system";
    root().dataset.theme = "light";

    // Act
    await syncPopupTheme(root());

    // Assert
    expect(root().hasAttribute("data-theme")).toBe(false);
    expect(readThemeMirror()).toBe("system");
  });

  it("should follow the OS scheme when the app never sent a preference", async () => {
    // Arrange
    const el = root();

    // Act
    const theme = await syncPopupTheme(el);

    // Assert
    expect(theme).toBeNull();
    expect(el.hasAttribute("data-theme")).toBe(false);
  });

  it("should ignore a stored value outside the three literals", async () => {
    // Arrange
    globalThis.__chromeLocalStore[KD_THEME_KEY] = "sepia";

    // Act
    const theme = await syncPopupTheme(root());

    // Assert
    expect(theme).toBeNull();
    expect(root().hasAttribute("data-theme")).toBe(false);
  });

  it("should apply the mirror before the stored preference resolves", async () => {
    // Arrange
    localStorage.setItem(KD_THEME_KEY, "light");
    let release;
    chrome.storage.local.get.mockImplementationOnce(
      () => new Promise((resolve) => (release = resolve))
    );

    // Act
    const pending = syncPopupTheme(root());
    const beforeStorage = root().dataset.theme;
    release({ [KD_THEME_KEY]: "dark" });
    await pending;

    // Assert
    expect(beforeStorage).toBe("light");
    expect(root().dataset.theme).toBe("dark");
    expect(readThemeMirror()).toBe("dark");
  });

  it("should keep the mirrored theme when chrome.storage is unavailable", async () => {
    // Arrange
    localStorage.setItem(KD_THEME_KEY, "dark");
    chrome.storage.local.get.mockRejectedValueOnce(new Error("unavailable"));

    // Act
    const theme = await syncPopupTheme(root());

    // Assert
    expect(theme).toBe("dark");
    expect(root().dataset.theme).toBe("dark");
  });
});
