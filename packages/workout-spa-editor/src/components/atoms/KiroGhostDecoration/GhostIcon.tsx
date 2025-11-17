type GhostIconProps = {
  width: number;
  height: number;
  fill: string;
  filterId: string;
  className?: string;
};

export const GhostIcon = ({
  width,
  height,
  fill,
  filterId,
  className = "",
}: GhostIconProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M60 20C40 20 25 35 25 55V100L35 90L45 100L55 90L65 100L75 90L85 100L95 90V55C95 35 80 20 60 20Z"
        fill={fill}
        filter={`url(#${filterId})`}
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
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
};
