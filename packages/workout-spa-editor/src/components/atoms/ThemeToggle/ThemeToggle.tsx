import { Moon, Sun } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

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
 *
 * Forwards its ref and any extra props so a Radix `asChild` slot can adopt
 * it as a menu row. The header's account menu needs that: Radix menus
 * `preventDefault()` on Tab, so a plain button nested inside menu content
 * would be unreachable by keyboard.
 */
type ThemeToggleProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(
  ({ className = "", onClick, ...props }, ref) => {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const t = useTranslate("common");

    // A slot's own click handler is composed, not replaced: Radix's menu-item
    // click is what dispatches its select event, and dropping it would leave
    // the row inert as a menu row while still toggling the theme.
    const handleToggle: ThemeToggleProps["onClick"] = (event) => {
      onClick?.(event);
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
        ref={ref}
        variant="tertiary"
        size="sm"
        {...props}
        onClick={handleToggle}
        aria-label={ariaLabel}
        title={ariaLabel}
        data-testid="theme-toggle"
        className={`h-11 w-11 p-0 ${className}`}
      >
        <Icon icon={currentIcon} size="md" aria-hidden="true" />
      </Button>
    );
  }
);

ThemeToggle.displayName = "ThemeToggle";
