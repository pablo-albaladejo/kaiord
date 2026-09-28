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
 */
export function ConvertFlow({ pair }: ConvertFlowProps) {
  const t = useTranslate("editor");
  const analytics = useAnalytics();
  const [krd, setKrd] = useState<KRD | null>(null);

  return (
    <div className="flex flex-col gap-4" data-testid="convert-flow">
      <section className="flex flex-col gap-2">
        <h2 className="m-0 text-sm font-semibold text-ink-strong">
          {t("convert.chooseFile", { from: formatLabel(pair.from) })}
        </h2>
        <FileUpload
          accept={acceptFor(pair.from)}
          onFileLoad={setKrd}
          onImported={(format) =>
            analytics.event("workout-imported", { format })
          }
        />
      </section>
      {krd && (
        <section className="flex flex-col gap-2">
          <h2 className="m-0 text-sm font-semibold text-ink-strong">
            {t("convert.download", { to: formatLabel(pair.to) })}
          </h2>
          <ConvertExport workout={krd} format={pair.to} />
        </section>
      )}
    </div>
  );
}
