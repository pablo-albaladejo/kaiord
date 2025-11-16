import { useTheme } from "@/contexts/ThemeContext";

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
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M60 20C40 20 25 35 25 55V100L35 90L45 100L55 90L65 100L75 90L85 100L95 90V55C95 35 80 20 60 20Z"
            fill="#c4b5fd"
            filter="url(#glow)"
          />
          <circle cx="45" cy="50" r="5" fill="#2d1b4e" />
          <circle cx="75" cy="50" r="5" fill="#2d1b4e" />
          <path
            d="M50 65Q60 70 70 65"
            stroke="#2d1b4e"
            strokeWidth="3"
            fill="none"
          />
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Bottom-left ghost - Medium Lilac */}
      <div className="absolute bottom-10 left-10 animate-float-delayed opacity-45">
        <svg
          width="100"
          height="100"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M60 20C40 20 25 35 25 55V100L35 90L45 100L55 90L65 100L75 90L85 100L95 90V55C95 35 80 20 60 20Z"
            fill="#a78bfa"
            filter="url(#glow2)"
          />
          <circle cx="45" cy="50" r="5" fill="#2d1b4e" />
          <circle cx="75" cy="50" r="5" fill="#2d1b4e" />
          <path
            d="M50 65Q60 70 70 65"
            stroke="#2d1b4e"
            strokeWidth="3"
            fill="none"
          />
          <defs>
            <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Center-right small ghost - Soft Lilac */}
      <div className="absolute right-20 top-1/2 animate-float opacity-35">
        <svg
          width="80"
          height="80"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M60 20C40 20 25 35 25 55V100L35 90L45 100L55 90L65 100L75 90L85 100L95 90V55C95 35 80 20 60 20Z"
            fill="#ddd6fe"
            filter="url(#glow3)"
          />
          <circle cx="45" cy="50" r="5" fill="#2d1b4e" />
          <circle cx="75" cy="50" r="5" fill="#2d1b4e" />
          <path
            d="M50 65Q60 70 70 65"
            stroke="#2d1b4e"
            strokeWidth="3"
            fill="none"
          />
          <defs>
            <filter id="glow3" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
};
