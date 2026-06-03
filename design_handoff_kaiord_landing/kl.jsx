// kl.jsx — Kaiord landing tokens, logo, atoms, and a reusable editor mockup.
// Exact values from styles/brand-tokens.css. Exports to window.

const KL = {
  bg: "#0f172a", // --brand-bg-primary
  bgDeep: "#0b1220", // --brand-bg-deep
  surface: "#1e293b", // --brand-bg-surface
  elevated: "#334155", // --brand-bg-elevated
  border: "#334155", // --brand-border
  borderSoft: "#1e293b", // --brand-border-soft
  text: "#f8fafc", // --brand-text-primary
  textSec: "#cbd5e1", // --brand-text-secondary
  muted: "#94a3b8", // --brand-text-muted
  blue: "#0284c7", // --brand-accent-blue
  blueHover: "#0369a1",
  blueSoft: "#0c4a6e", // --brand-accent-blue-soft
  blueBright: "#38bdf8", // sky-400 (on-dark)
  purple: "#9333ea", // --brand-accent-purple
  tip: "#34d399", // --brand-semantic-tip
  font: '"Inter", system-ui, -apple-system, sans-serif',
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};
const ZONES = ["#64748b", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"];

// ── Kaiord hexagon logo ─────────────────────────────────────────────
function Logo({ size = 28, color = KL.blue, spokes = true }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      style={{ display: "block", color }}
      aria-hidden="true"
    >
      <g transform="translate(2,2) scale(0.9)">
        <path
          d="M20 0L37.32 10L37.32 30L20 40L2.68 30L2.68 10Z"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx="20" cy="20" r="5" fill="currentColor" />
        {spokes &&
          [
            ["20", "2"],
            ["35.6", "11"],
            ["35.6", "29"],
            ["20", "38"],
            ["4.4", "29"],
            ["4.4", "11"],
          ].map(([x, y], i) => (
            <line
              key={i}
              x1="20"
              y1="20"
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.5"
            />
          ))}
      </g>
    </svg>
  );
}

// ── tiny icon set ───────────────────────────────────────────────────
const LI = {
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  sparkle:
    '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z"/>',
  bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M5.5 17.5 10 8h4l3 6m-7.5 3.5h7M14 8h3.5M10 8 8 6"/>',
  watch:
    '<rect x="6" y="6" width="12" height="12" rx="3.5"/><path d="M9 6l.7-3h4.6L15 6M9 18l.7 3h4.6l.7-3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 6.5"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>',
  flame:
    '<path d="M12 3c1 3.5 4.5 4.8 4.5 8.5A4.5 4.5 0 0 1 12 16a4.5 4.5 0 0 1-4.5-4.5C7.5 9.5 9 8 9 6c1.2.7 2.4 1.7 3 3 .3-2 .2-4 0-6z"/>',
  terminal: '<path d="M4 5h16v14H4zM7 9l3 3-3 3M13 15h4"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
};
function LIcon({ name, size = 18, color = "currentColor", sw = 2, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: LI[name] || "" }}
    />
  );
}

// ── atoms ───────────────────────────────────────────────────────────
function LBtn({
  children,
  variant = "primary",
  icon,
  iconR,
  size = "md",
  style,
}) {
  const pads = { md: "12px 20px", lg: "15px 26px" };
  const fs = { md: 15, lg: 16.5 };
  const v = {
    primary: {
      background: KL.blue,
      color: "#fff",
      border: "1px solid transparent",
    },
    ghost: {
      background: "transparent",
      color: KL.text,
      border: `1px solid ${KL.border}`,
    },
    soft: {
      background: KL.blueSoft,
      color: KL.blueBright,
      border: "1px solid transparent",
    },
  }[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        padding: pads[size],
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: KL.font,
        fontSize: fs[size],
        fontWeight: 650,
        whiteSpace: "nowrap",
        ...v,
        ...style,
      }}
    >
      {icon && <LIcon name={icon} size={18} />}
      {children}
      {iconR && <LIcon name={iconR} size={18} />}
    </span>
  );
}

function Badge({ children, dot, icon, color = KL.textSec }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 13px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        border: `1px solid ${KL.border}`,
        background: KL.surface,
        fontFamily: KL.font,
        fontSize: 12.5,
        fontWeight: 600,
        color,
      }}
    >
      {dot && (
        <span
          style={{ width: 7, height: 7, borderRadius: 9, background: color }}
        />
      )}
      {icon && <LIcon name={icon} size={13} color={color} />}
      {children}
    </span>
  );
}

// ── Editor phone mockup — static, compact "Today" + push ────────────
function EditorPhone({ scale = 1, glow = true }) {
  return (
    <div
      style={{
        position: "relative",
        width: 270 * scale,
        transform: `scale(${1})`,
        transformOrigin: "top center",
      }}
    >
      {glow && (
        <div
          style={{
            position: "absolute",
            inset: "-18% -14%",
            borderRadius: 60,
            background: `radial-gradient(closest-side, ${KL.blue}33, transparent)`,
            filter: "blur(20px)",
            zIndex: 0,
          }}
        />
      )}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: 270 * scale,
          borderRadius: 38 * scale,
          padding: 9 * scale,
          background: "linear-gradient(160deg, #2a3850, #131c2e)",
          boxShadow: "0 30px 60px rgba(0,0,0,.5)",
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div
          style={{
            borderRadius: 30 * scale,
            overflow: "hidden",
            background: KL.bgDeep,
            height: 540 * scale,
            position: "relative",
          }}
        >
          {/* status */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: `${14 * scale}px ${20 * scale}px 6px`,
              fontFamily: KL.font,
              fontSize: 12 * scale,
              fontWeight: 600,
              color: KL.text,
            }}
          >
            <span>9:41</span>
            <span style={{ display: "flex", gap: 4 }}>
              <span
                style={{
                  width: 16 * scale,
                  height: 9 * scale,
                  borderRadius: 2,
                  border: `1.4px solid ${KL.muted}`,
                }}
              />
            </span>
          </div>
          <div style={{ padding: `${8 * scale}px ${16 * scale}px` }}>
            <div
              style={{
                fontFamily: KL.font,
                fontSize: 12.5 * scale,
                color: KL.muted,
              }}
            >
              Thursday, May 29
            </div>
            <div
              style={{
                fontFamily: KL.font,
                fontSize: 25 * scale,
                fontWeight: 780,
                letterSpacing: "-.02em",
                color: KL.text,
                marginBottom: 12 * scale,
              }}
            >
              Today
            </div>
            {/* readiness */}
            <div
              style={{
                background: KL.surface,
                border: `1px solid ${KL.border}`,
                borderRadius: 16 * scale,
                padding: 13 * scale,
                display: "flex",
                alignItems: "center",
                gap: 12 * scale,
                marginBottom: 11 * scale,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 54 * scale,
                  height: 54 * scale,
                }}
              >
                <svg
                  width={54 * scale}
                  height={54 * scale}
                  style={{ transform: "rotate(-90deg)" }}
                >
                  <circle
                    cx={27 * scale}
                    cy={27 * scale}
                    r={23 * scale}
                    fill="none"
                    stroke={KL.elevated}
                    strokeWidth={5 * scale}
                  />
                  <circle
                    cx={27 * scale}
                    cy={27 * scale}
                    r={23 * scale}
                    fill="none"
                    stroke={KL.tip}
                    strokeWidth={5 * scale}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 23 * scale}
                    strokeDashoffset={2 * Math.PI * 23 * scale * 0.18}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: KL.font,
                    fontSize: 16 * scale,
                    fontWeight: 750,
                    color: KL.text,
                  }}
                >
                  82
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: KL.font,
                    fontSize: 13.5 * scale,
                    fontWeight: 700,
                    color: KL.text,
                  }}
                >
                  Good to push today
                </div>
                <div
                  style={{
                    fontFamily: KL.font,
                    fontSize: 11 * scale,
                    color: KL.muted,
                    marginTop: 2,
                  }}
                >
                  Recovery on track — green light.
                </div>
              </div>
            </div>
            {/* session card */}
            <div
              style={{
                background: KL.surface,
                border: `1px solid ${KL.border}`,
                borderRadius: 16 * scale,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: 13 * scale }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10 * scale,
                    marginBottom: 11 * scale,
                  }}
                >
                  <div
                    style={{
                      width: 38 * scale,
                      height: 38 * scale,
                      borderRadius: 11 * scale,
                      background: KL.bgDeep,
                      border: `1px solid ${KL.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LIcon
                      name="bike"
                      size={20 * scale}
                      color={KL.blueBright}
                      sw={1.8}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: KL.font,
                        fontSize: 14.5 * scale,
                        fontWeight: 700,
                        color: KL.text,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Sweet Spot 3×12
                    </div>
                    <div
                      style={{
                        fontFamily: KL.font,
                        fontSize: 11 * scale,
                        color: KL.muted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Build sustained power.
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 13 * scale,
                    marginBottom: 11 * scale,
                  }}
                >
                  {[
                    ["clock", "1h 05m"],
                    ["flame", "78 TSS"],
                  ].map(([ic, v], i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontFamily: KL.font,
                        fontSize: 11.5 * scale,
                        color: KL.textSec,
                        fontWeight: 600,
                      }}
                    >
                      <LIcon name={ic} size={13 * scale} color={KL.muted} />
                      {v}
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 2,
                    height: 8 * scale,
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  {[0.12, 0.3, 0.16, 0.4, 0.02].map((w, i) => (
                    <div key={i} style={{ flex: w, background: ZONES[i] }} />
                  ))}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8 * scale,
                  padding: 11 * scale,
                  borderTop: `1px solid ${KL.borderSoft}`,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: `${9 * scale}px`,
                    borderRadius: 11 * scale,
                    border: `1px solid ${KL.border}`,
                    fontFamily: KL.font,
                    fontSize: 12.5 * scale,
                    fontWeight: 650,
                    color: KL.text,
                  }}
                >
                  Details
                </div>
                <div
                  style={{
                    flex: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: `${9 * scale}px`,
                    borderRadius: 11 * scale,
                    background: KL.blue,
                    fontFamily: KL.font,
                    fontSize: 12.5 * scale,
                    fontWeight: 650,
                    color: "#fff",
                  }}
                >
                  <LIcon name="watch" size={14 * scale} color="#fff" sw={2} />
                  Push to Garmin
                </div>
              </div>
            </div>
          </div>
          {/* bottom nav hint */}
          <div
            style={{
              position: "absolute",
              left: 14 * scale,
              right: 14 * scale,
              bottom: 12 * scale,
              height: 50 * scale,
              borderRadius: 18 * scale,
              background: "rgba(15,23,42,.82)",
              backdropFilter: "blur(10px)",
              border: `1px solid ${KL.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            {[KL.blueBright, KL.muted, KL.muted, KL.muted].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 7 * scale,
                  height: 7 * scale,
                  borderRadius: 9,
                  background: c,
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: -16 * scale,
                transform: "translateX(-50%)",
                width: 42 * scale,
                height: 42 * scale,
                borderRadius: 14 * scale,
                background: `linear-gradient(160deg, ${KL.blueBright}, ${KL.blue})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 6px 16px ${KL.blue}66`,
                color: "#fff",
                fontSize: 24 * scale,
                fontWeight: 300,
              }}
            >
              +
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { KL, ZONES, Logo, LIcon, LBtn, Badge, EditorPhone });
