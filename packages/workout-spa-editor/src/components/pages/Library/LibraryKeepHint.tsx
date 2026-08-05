import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";

/** Dashed footer under a populated library: what lands here, and the one
    action that fills it. Rendered only when the list has rows — the empty
    library already says the same thing in `LibraryEmpty`. */
export function LibraryKeepHint() {
  const t = useTranslate("library");
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-dashed border-edge-soft bg-surface-deep p-4">
      <div className="flex-1 basis-60">
        <p className="m-0 text-[13px] font-medium text-ink-body">
          {t("keepHint.title")}
        </p>
        <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-ink-muted">
          {t("keepHint.body")}
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate("/workout/new?source=scratch")}
        className="shrink-0 rounded-[8px] border border-edge px-4 py-2 text-[13px] font-medium text-ink-body transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:border-edge-strong hover:text-ink-strong"
      >
        {t("keepHint.action")}
      </button>
    </div>
  );
}
