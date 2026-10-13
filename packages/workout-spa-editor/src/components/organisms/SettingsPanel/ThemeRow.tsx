import { type Theme, useTheme } from "../../../contexts/ThemeContext";
import { useTranslate } from "../../../i18n/use-translate";
import { Segmented, type SegmentedOption } from "../../atoms/Segmented";
import { SectionHead } from "../../molecules/SectionHead";

export const ThemeRow: React.FC = () => {
  const t = useTranslate("settings");
  const { theme, setTheme } = useTheme();
  const options: SegmentedOption<Theme>[] = [
    { value: "system", label: t("general.themeSystem") },
    { value: "light", label: t("general.themeLight") },
    { value: "dark", label: t("general.themeDark") },
  ];

  return (
    <section>
      <SectionHead title={t("general.theme")} />
      <Segmented
        options={options}
        value={theme}
        onChange={setTheme}
        ariaLabel={t("general.theme")}
      />
    </section>
  );
};
