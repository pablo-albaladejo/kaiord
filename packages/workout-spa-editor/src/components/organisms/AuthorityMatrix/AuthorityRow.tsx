import type { ManagedDataType } from "@kaiord/core";

import type { SourceOfTruthOptions } from "../../../application/connections/source-of-truth-options";
import type { SourceOfTruthEditor } from "../../../hooks/connections/use-source-of-truth-editor";
import { useTranslate } from "../../../i18n/use-translate";
import { authorityNow } from "./authority-copy";
import { AuthorityChoices } from "./AuthorityChoices";

type Props = {
  dataType: ManagedDataType;
  options: SourceOfTruthOptions;
  editor: SourceOfTruthEditor;
};

export function AuthorityRow({ dataType, options, editor }: Props) {
  const t = useTranslate("settings");
  const tConnections = useTranslate("connections");
  const type = tConnections(`dataTypes.${dataType}`);

  return (
    <li
      className="space-y-2 rounded-xl border border-edge-soft bg-surface px-4 py-3"
      data-testid={`authority-row-${dataType}`}
    >
      <p className="text-[14px] font-semibold text-ink-strong">{type}</p>
      <p
        className="text-[12.5px] text-ink-muted"
        data-testid={`authority-now-${dataType}`}
      >
        {authorityNow(dataType, options, type, t, tConnections)}
      </p>
      <AuthorityChoices
        dataType={dataType}
        options={options}
        onPick={(sourceId) => {
          void editor.pick(dataType, options, sourceId);
        }}
        onAutomatic={() => {
          void editor.automatic(dataType);
        }}
      />
    </li>
  );
}
