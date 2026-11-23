import { canChooseSource } from "../../../application/connections/source-of-truth-options";
import { useDataFlows } from "../../../hooks/connections/use-data-flows";
import { useDataTypeRouting } from "../../../hooks/connections/use-data-type-routing";
import { useSourceOfTruthEditor } from "../../../hooks/connections/use-source-of-truth-editor";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { AuthorityRow } from "./AuthorityRow";

/**
 * The Authority matrix: for each kind of data more than one source reports,
 * which one decides. Kaiord decides by itself; a choice here overrides it
 * while this Capability is on.
 */
export function AuthorityTab() {
  const t = useTranslate("settings");
  const active = useActiveProfileLive();
  const profileId = active?.id ?? null;
  const { byDataType } = useDataFlows(profileId ?? "");
  const { options } = useDataTypeRouting(profileId, byDataType);
  const editor = useSourceOfTruthEditor(profileId ?? "");
  const rows = [...options].filter(([, o]) => canChooseSource(o));

  return (
    <div className="space-y-4" data-testid="settings-authority">
      <p className="text-sm text-ink-body">{t("authority.intro")}</p>
      {rows.length === 0 || profileId === null ? (
        <p className="text-sm text-ink-muted" data-testid="authority-empty">
          {t("authority.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map(([dataType, rowOptions]) => (
            <AuthorityRow
              key={dataType}
              dataType={dataType}
              options={rowOptions}
              editor={editor}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
