import { Moon, Sun } from "lucide-react";

import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";

/**
 * ThemeToggle Component
 *
 * Requirement 13: Theme toggle UI
 * - Shows current theme icon (sun for light, moon for dark)
 * - Cycles between light → dark → light
 * - Smooth transition between themes (handled by CSS)
 * - Accessible with proper ARIA labels
 */
export const ThemeToggle = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const t = useTranslate("common");

  const handleToggle = () => {
    // Cycle through themes: light → dark → light
    if (theme === "system") {
      // If on system, start cycling from resolved theme
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  // Determine icon and label based on resolved theme
  const currentIcon = resolvedTheme === "dark" ? Moon : Sun;
  const ariaLabel =
    resolvedTheme === "dark"
      ? t("a11y.switchToLightMode")
      : t("a11y.switchToDarkMode");

  return (
    <Button
      variant="tertiary"
      size="sm"
      onClick={handleToggle}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="h-11 w-11 p-0"
    >
      <Icon icon={currentIcon} size="md" aria-hidden="true" />
    </Button>
  );
};
