import type { EditorCommand } from "./editor-command.types";

const DOCS_ORIGIN = "https://kaiord.com/docs";

/** The docs site is the one copy of the long form — the palette only links. */
export const DOCS_URL = `${DOCS_ORIGIN}/`;

const LEARN_PAGES = [
  { id: "quick-start", path: "/guide/quick-start" },
  { id: "formats", path: "/formats/krd" },
  { id: "convert", path: "/convert/" },
] as const;

export const openDocs = (path: string): void => {
  window.open(`${DOCS_ORIGIN}${path}`, "_blank", "noopener,noreferrer");
};

export const buildLearnCommands = (): ReadonlyArray<EditorCommand> =>
  LEARN_PAGES.map((page) => ({
    id: `learn-${page.id}`,
    group: "learn",
    titleKey: `learn.${page.id}.title`,
    subtitleKey: `learn.${page.id}.subtitle`,
    enabled: true,
    run: () => openDocs(page.path),
  }));
