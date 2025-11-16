import { Ghost, Moon, Sun } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";

/**
 * ThemeToggle Component
 *
 * Requirement 13: Theme toggle UI
 * - Shows current theme icon (sun for light, moon for dark, ghost for kiroween)
 * - Cycles between light → dark → kiroween → light
 * - Smooth transition between themes (handled by CSS)
 * - Accessible with proper ARIA labels
 */
export const ThemeToggle = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const handleToggle = () => {
    // Cycle through themes: light → dark → kiroween → light
    if (theme === "system") {
      // If on system, start cycling from resolved theme
      setTheme(resolvedTheme === "dark" ? "kiroween" : "dark");
    } else if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("kiroween");
    } else if (theme === "kiroween") {
      setTheme("light");
    }
  };

  // Determine icon and label based on resolved theme
  let currentIcon = Sun;
  let ariaLabel = "Switch to dark mode";

  if (resolvedTheme === "dark") {
    currentIcon = Moon;
    ariaLabel = "Switch to Kiroween mode";
  } else if (resolvedTheme === "kiroween") {
    currentIcon = Ghost;
    ariaLabel = "Switch to light mode";
  }

  return (
    <Button
      variant="ghost"
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
