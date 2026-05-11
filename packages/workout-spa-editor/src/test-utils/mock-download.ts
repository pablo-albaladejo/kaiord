/**
 * Shared mock for the `document.createElement('a')` -> click -> remove
 * download flow used by `backup-download`, `export-workout`, and
 * `save-workout` test suites.
 *
 * Replaces ~10 cast-laden `vi.spyOn` blocks per test file with a
 * single call that returns the shared anchor stub plus the spies the
 * tests need to assert on.
 */

import { vi } from "vitest";

export type MockAnchor = {
  href: string;
  download: string;
  click: ReturnType<typeof vi.fn>;
};

export type DownloadMock = {
  anchor: MockAnchor;
  createElementSpy: ReturnType<typeof vi.spyOn>;
  appendChildSpy: ReturnType<typeof vi.spyOn>;
  removeChildSpy: ReturnType<typeof vi.spyOn>;
};

/**
 * Install spies on `document.createElement`, `document.body.appendChild`,
 * and `document.body.removeChild` so the SUT can synthesize and click an
 * anchor element without touching jsdom's real DOM.
 */
export function setupDownloadMock(): DownloadMock {
  const anchor: MockAnchor = { href: "", download: "", click: vi.fn() };
  const createElementSpy = vi
    .spyOn(document, "createElement")
    .mockReturnValue(anchor as unknown as HTMLAnchorElement);
  const appendChildSpy = vi
    .spyOn(document.body, "appendChild")
    .mockImplementation(() => anchor as unknown as Node);
  const removeChildSpy = vi
    .spyOn(document.body, "removeChild")
    .mockImplementation(() => anchor as unknown as Node);
  return { anchor, createElementSpy, appendChildSpy, removeChildSpy };
}
