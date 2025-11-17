import { useTheme } from "@/contexts/ThemeContext";
import { GhostIcon } from "./GhostIcon";

/**
 * Kiro Ghost Decoration Component
 *
 * Requirement 13: Kiroween theme decorations
 * - Displays floating ghost decorations when Kiroween theme is active
 * - Automatically hidden for other themes
 * - Uses CSS animations for floating effect
 */
export const KiroGhostDecoration = () => {
  const { resolvedTheme } = useTheme();

  // Only render for Kiroween theme
  if (resolvedTheme !== "kiroween") {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Top-right ghost - Vibrant Lilac */}
      <div className="absolute right-10 top-10 animate-float opacity-40">
        <GhostIcon width={120} height={120} fill="#c4b5fd" filterId="glow" />
      </div>

      {/* Bottom-left ghost - Medium Lilac */}
      <div className="absolute bottom-10 left-10 animate-float-delayed opacity-45">
        <GhostIcon width={100} height={100} fill="#a78bfa" filterId="glow2" />
      </div>

      {/* Center-right small ghost - Soft Lilac */}
      <div className="absolute right-20 top-1/2 animate-float opacity-35">
        <GhostIcon width={80} height={80} fill="#ddd6fe" filterId="glow3" />
      </div>
    </div>
  );
};
