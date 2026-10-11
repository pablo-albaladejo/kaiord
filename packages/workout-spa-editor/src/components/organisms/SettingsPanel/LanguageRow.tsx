import { useTranslation } from "react-i18next";

import type { LocalePreference } from "../../../types/user-preferences";
import { Segmented, type SegmentedOption } from "../../atoms/Segmented";
import { SectionHead } from "../../molecules/SectionHead";

type LanguageRowProps = {
  value: LocalePreference;
  onChange: (next: LocalePreference) => void;
  disabled?: boolean;
};

export const LanguageRow: React.FC<LanguageRowProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const { t } = useTranslation("common");
  const options: SegmentedOption<LocalePreference>[] = [
    { value: "auto", label: t("language.auto") },
    { value: "en", label: t("language.en") },
    { value: "es", label: t("language.es") },
  ];

  return (
    <section>
      <SectionHead title={t("language.label")} />
      <Segmented
        options={options}
        value={value}
        onChange={onChange}
        ariaLabel={t("language.label")}
        disabled={disabled}
      />
    </section>
  );
};
