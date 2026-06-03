// kt.jsx — Kaiord design tokens, icon set, shared atoms.
// Exports to window. No global `styles` object (collision-safe).

// ── Tokens (dark, slate + sky — from brand-tokens.css) ──────────────
const KT = {
  bg: "#0b1220", // page (a touch deeper than slate-900 for contrast)
  bgAlt: "#0f172a", // slate-900
  surface: "#172033", // cards (between 900/800)
  surface2: "#1e293b", // slate-800 elevated
  elevated: "#243244", // slate-700-ish
  hair: "#26324a", // hairline border
  hair2: "#1d2740", // softer hairline
  text: "#f8fafc", // slate-50
  textSec: "#cbd5e1", // slate-300
  muted: "#8a99b3", // slate-400-ish
  faint: "#5b6b86",
  accent: "#0284c7", // sky-600 (brand)
  accentBri: "#38bdf8", // sky-400 (on-dark text/icon)
  accentDim: "#0c4a6e", // sky-900 soft bg
  tip: "#34d399", // emerald-400
  warn: "#fbbf24", // amber-400
  danger: "#f87171", // red-400
  purple: "#a855f7",
  font: '"Inter", system-ui, -apple-system, sans-serif',
};

// 5-zone training palette (functional, reads on dark)
const ZONE_COLORS = ["#64748b", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"];

// ── Icon set (Lucide-style, 24 viewBox, stroke) ─────────────────────
const ICON_PATHS = {
  today:
    '<rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4M8.5 15l2.2 2.2 4-4.4"/>',
  library: '<path d="M4 5h16M4 12h16M4 19h10"/>',
  cards:
    '<rect x="3" y="4" width="18" height="6.5" rx="2"/><rect x="3" y="13.5" width="18" height="6.5" rx="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  athlete:
    '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5S20 17 20 21"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.7 5.3l-1.7 1.7M7 17l-1.7 1.7M18.7 18.7 17 17M7 7 5.3 5.3"/>',
  bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M5.5 17.5 10 8h4l3 6m-7.5 3.5h7M14 8h3.5M10 8 8 6"/>',
  run: '<circle cx="14" cy="5" r="2"/><path d="M10.5 8.5 13 7l2.5 2.5 2.5 1M13 7l-2.8 4 2.3 2.2.5 4.8M10.5 13.2 7 14.5l-2 3.5"/>',
  swim: '<path d="M3 16c1.5 0 1.5 1.4 3 1.4S9.5 16 11 16s1.5 1.4 3 1.4S18.5 16 20 16M3 20c1.5 0 1.5 1.4 3 1.4S9.5 20 11 20s1.5 1.4 3 1.4S18.5 20 20 20"/><circle cx="16" cy="6" r="2"/><path d="M5.5 13 11 9l3 2.2"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  sparkle:
    '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z"/><path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z"/>',
  heart:
    '<path d="M12 20s-7-4.7-9.3-9.2C1 7.5 2.8 4.5 6 4.5c2 0 3.3 1.2 4 2.3.7-1.1 2-2.3 4-2.3 3.2 0 5 3 3.3 6.3C19 15.3 12 20 12 20z"/>',
  watch:
    '<rect x="6" y="6" width="12" height="12" rx="3.5"/><path d="M9 6l.7-3h4.6L15 6M9 18l.7 3h4.6l.7-3"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  chevD: '<path d="M5 9l7 7 7-7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 6.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>',
  route:
    '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.3 17.6 16 6.6"/>',
  flame:
    '<path d="M12 3c1 3.5 4.5 4.8 4.5 8.5A4.5 4.5 0 0 1 12 16a4.5 4.5 0 0 1-4.5-4.5C7.5 9.5 9 8 9 6c1.2.7 2.4 1.7 3 3 .3-2 .2-4 0-6z"/><path d="M9.5 19h5"/>',
  sync: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 12a9 9 0 0 1-15 6.7L3 16M21 4v4h-4M3 20v-4h4"/>',
  link: '<path d="M9 12h6M10 7.5H8a4.5 4.5 0 0 0 0 9h2M14 7.5h2a4.5 4.5 0 0 1 0 9h-2"/>',
  dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/>',
  target:
    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="0.6"/>',
  shield: '<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z"/>',
  calendar:
    '<rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0"/>',
  trend: '<path d="M3 17l5-5 3.5 3.5L21 6M21 6h-4.5M21 6v4.5"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
};

function Icon({
  name,
  size = 22,
  color = "currentColor",
  sw = 1.9,
  fill = "none",
  style,
}) {
  const p = ICON_PATHS[name] || "";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: p }}
    />
  );
}

const SPORT_ICON = { cycling: "bike", running: "run", swimming: "swim" };

// ── Atoms ───────────────────────────────────────────────────────────
function Card({ children, style, onClick, pad = 16 }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: KT.surface,
        border: `1px solid ${KT.hair}`,
        borderRadius: 20,
        padding: pad,
        ...(onClick ? { cursor: "pointer" } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange(!on);
      }}
      style={{
        width: 46,
        height: 28,
        borderRadius: 999,
        border: "none",
        padding: 3,
        background: on ? KT.accent : KT.elevated,
        cursor: "pointer",
        display: "flex",
        justifyContent: on ? "flex-end" : "flex-start",
        transition: "background .25s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.4)",
          transition: "all .25s ease",
        }}
      />
    </button>
  );
}

function Segmented({ options, value, onChange, style }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: 4,
        background: KT.bgAlt,
        border: `1px solid ${KT.hair2}`,
        borderRadius: 14,
        ...style,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: "9px 6px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: active ? KT.accent : "transparent",
              color: active ? "#fff" : KT.muted,
              fontFamily: KT.font,
              fontSize: 14,
              fontWeight: 600,
              transition: "all .18s ease",
            }}
          >
            {o.icon && <Icon name={o.icon} size={17} sw={2} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Pill({ children, color = KT.muted, bg, icon, style }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        color,
        background: bg || "rgba(255,255,255,.04)",
        border: `1px solid ${bg ? "transparent" : KT.hair2}`,
        fontFamily: KT.font,
        lineHeight: 1,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={13} sw={2.2} color={color} />}
      {children}
    </span>
  );
}

function Btn({
  children,
  onClick,
  variant = "primary",
  icon,
  full,
  style,
  size = "md",
}) {
  const pads = { sm: "9px 14px", md: "13px 18px", lg: "16px 20px" };
  const fs = { sm: 14, md: 15.5, lg: 16.5 };
  const base = {
    primary: {
      background: KT.accent,
      color: "#fff",
      border: "1px solid transparent",
    },
    ghost: {
      background: "rgba(255,255,255,.05)",
      color: KT.text,
      border: `1px solid ${KT.hair}`,
    },
    soft: {
      background: KT.accentDim,
      color: KT.accentBri,
      border: "1px solid transparent",
    },
    danger: {
      background: "rgba(248,113,113,.12)",
      color: KT.danger,
      border: "1px solid rgba(248,113,113,.25)",
    },
  }[variant];
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        padding: pads[size],
        borderRadius: 14,
        cursor: "pointer",
        fontFamily: KT.font,
        fontSize: fs[size],
        fontWeight: 650,
        width: full ? "100%" : undefined,
        transition: "transform .1s ease, filter .15s ease",
        ...base,
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.975)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {icon && <Icon name={icon} size={size === "lg" ? 20 : 18} sw={2.2} />}
      {children}
    </button>
  );
}

// Section heading (eyebrow + optional action)
function SectionHead({ title, action, onAction }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontFamily: KT.font,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: KT.faint,
        }}
      >
        {title}
      </h3>
      {action && (
        <button
          onClick={onAction}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: KT.accentBri,
            fontFamily: KT.font,
            fontSize: 13.5,
            fontWeight: 600,
            padding: 0,
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

Object.assign(window, {
  KT,
  ZONE_COLORS,
  Icon,
  SPORT_ICON,
  Card,
  Toggle,
  Segmented,
  Pill,
  Btn,
  SectionHead,
});
