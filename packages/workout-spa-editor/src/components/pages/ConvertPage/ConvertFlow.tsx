import { useState } from "react";

import { useAnalytics } from "../../../contexts/analytics-context";
import { useTranslate } from "../../../i18n/use-translate";
import { acceptFor, type ConvertPair } from "../../../routing/convert-params";
import type { KRD } from "../../../types/krd";
import { FileUpload } from "../../molecules/FileUpload/FileUpload";
import { ConvertExport } from "./ConvertExport";
import { formatLabel } from "./format-labels";

type ConvertFlowProps = { pair: ConvertPair };

/**
 * Upload → download with the pair preselected. The parsed workout lives only
 * in this component's state: no `handleFileLoad`, no store, no persistence.
 * A file of another format, or one that fails to load, clears it, so the
 * download never offers a stale or mislabelled workout.
 */
export function ConvertFlow({ pair }: ConvertFlowProps) {
  const t = useTranslate("editor");
  const analytics = useAnalytics();
  const [krd, setKrd] = useState<KRD | null>(null);
  const [wrongFormat, setWrongFormat] = useState(false);

  // Fires right after `onFileLoad` in the same tick, so React batches both.
  const checkImported = (format: string) => {
    const matches = format === pair.from;
    setWrongFormat(!matches);
    if (!matches) return setKrd(null);
    analytics.event("workout-imported", { format });
  };

  return (
    <div className="flex flex-col gap-4" data-testid="convert-flow">
      <section className="flex flex-col gap-2">
        <h2 className="m-0 text-sm font-semibold text-ink-strong">
          {t("convert.chooseFile", { from: formatLabel(pair.from) })}
        </h2>
        <FileUpload
          accept={acceptFor(pair.from)}
          onFileLoad={setKrd}
          onError={() => setKrd(null)}
          onImported={checkImported}
        />
        {wrongFormat && (
          <p
            role="alert"
            className="m-0 text-sm text-danger-text"
            data-testid="convert-wrong-format"
          >
            {t("convert.wrongFormat", { from: formatLabel(pair.from) })}
          </p>
        )}
      </section>
      {krd && (
        <section className="flex flex-col gap-2">
          <h2 className="m-0 text-sm font-semibold text-ink-strong">
            {t("convert.download")}
          </h2>
          <ConvertExport workout={krd} format={pair.to} />
        </section>
      )}
    </div>
  );
}
