// landing-sections.jsx — full responsive Kaiord landing built on direction B.
// Depends on kl.jsx (KL, Logo, LIcon, LBtn, Badge, EditorPhone) + heroes.jsx (ForkCard, CodeBlock).

function useWidth() {
  const [w, setW] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  React.useEffect(() => {
    const f = () => setW(window.innerWidth);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return w;
}
const useMobile = () => useWidth() < 860;

function Container({ children, style }) {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", width: "100%", ...style }}>
      {children}
    </div>
  );
}
function Section({ children, id, border = true, style }) {
  const m = useMobile();
  return (
    <section
      id={id}
      style={{
        borderTop: border ? `1px solid ${KL.border}` : "none",
        padding: m ? "56px 22px" : "88px 48px",
        ...style,
      }}
    >
      <Container>{children}</Container>
    </section>
  );
}
function Eyebrow({ children, color = KL.blueBright }) {
  return (
    <div
      style={{
        fontFamily: KL.font,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: ".1em",
        textTransform: "uppercase",
        color,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}
function H2({ children, center, m }) {
  return (
    <h2
      style={{
        margin: 0,
        fontFamily: KL.font,
        fontSize: m ? 30 : 40,
        lineHeight: 1.1,
        fontWeight: 800,
        letterSpacing: "-.025em",
        color: KL.text,
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </h2>
  );
}

// ── NAV ─────────────────────────────────────────────────────────────
function Nav() {
  const m = useMobile();
  const links = ["Features", "Docs", "Developers", "Open Source", "GitHub"];
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(15,23,42,.92)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${KL.border}`,
      }}
    >
      <Container
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: m ? "14px 22px" : "16px 48px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Logo size={27} />
          <span
            style={{
              fontFamily: KL.font,
              fontSize: 18,
              fontWeight: 800,
              color: KL.text,
              letterSpacing: "-.01em",
            }}
          >
            kaiord
          </span>
        </div>
        {m ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span
              style={{
                fontFamily: KL.font,
                fontSize: 14.5,
                color: KL.textSec,
                fontWeight: 500,
              }}
            >
              Docs
            </span>
            <LBtn>Try the Editor</LBtn>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            {links.map((l) => (
              <span
                key={l}
                style={{
                  fontFamily: KL.font,
                  fontSize: 14.5,
                  color: KL.textSec,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {l}
              </span>
            ))}
            <LBtn>Try the Editor</LBtn>
          </div>
        )}
      </Container>
    </header>
  );
}

// ── HERO (fork) ─────────────────────────────────────────────────────
function Hero() {
  const m = useMobile();
  return (
    <section style={{ position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 360,
          background: `radial-gradient(closest-side, ${KL.blue}22, transparent)`,
          pointerEvents: "none",
        }}
      />
      <Container
        style={{
          padding: m ? "44px 22px 8px" : "72px 48px 12px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <Badge icon="sparkle" color={KL.blueBright}>
            Open-source training toolkit
          </Badge>
        </div>
        <h1
          style={{
            margin: "0 auto",
            maxWidth: 760,
            fontFamily: KL.font,
            fontSize: m ? 40 : 56,
            lineHeight: 1.05,
            fontWeight: 850,
            letterSpacing: "-.03em",
            color: KL.text,
          }}
        >
          One framework.
          <br />
          <span style={{ color: KL.blueBright }}>Every fitness format.</span>
        </h1>
        <p
          style={{
            margin: "20px auto 0",
            maxWidth: 560,
            fontFamily: KL.font,
            fontSize: m ? 16.5 : 18.5,
            lineHeight: 1.55,
            color: KL.textSec,
          }}
        >
          Whether you train or you build — Kaiord meets you where you are. Pick
          your path.
        </p>
      </Container>
      <Container style={{ padding: m ? "26px 22px 56px" : "34px 48px 80px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: m ? "column" : "row",
            gap: 20,
            alignItems: "stretch",
          }}
        >
          <ForkCard
            tone={KL.blueBright}
            eyebrow="For athletes"
            title="Use the editor"
            desc="Create, AI-generate, and sync structured workouts to Garmin. No code, no account."
            cta="Open the Editor"
            ctaVariant="primary"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                height: 320,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  transform: "scale(.64)",
                  transformOrigin: "top center",
                }}
              >
                <EditorPhone glow={false} />
              </div>
            </div>
          </ForkCard>
          <ForkCard
            tone={KL.purple}
            eyebrow="For developers"
            title="Build with the SDK"
            desc="Convert between FIT, TCX, ZWO & Garmin in 4 lines of TypeScript. Strategy pattern, your adapters."
            cta="Read the Docs"
            ctaVariant="soft"
          >
            <CodeBlock />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 16,
                padding: "11px 14px",
                borderRadius: 12,
                background: KL.bgDeep,
                border: `1px solid ${KL.border}`,
              }}
            >
              <span
                style={{
                  fontFamily: KL.mono,
                  fontSize: 13.5,
                  color: KL.textSec,
                }}
              >
                npm i @kaiord/core
              </span>
              <span style={{ marginLeft: "auto" }}>
                <LIcon name="copy" size={15} color={KL.muted} />
              </span>
            </div>
          </ForkCard>
        </div>
      </Container>
    </section>
  );
}

// ── SHOWCASE (athletes) ─────────────────────────────────────────────
function FeatureRow({ icon, tone, title, desc }) {
  return (
    <div style={{ display: "flex", gap: 15, alignItems: "flex-start" }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          flexShrink: 0,
          background: `${tone}1a`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LIcon name={icon} size={21} color={tone} sw={1.9} />
      </div>
      <div>
        <h3
          style={{
            margin: 0,
            fontFamily: KL.font,
            fontSize: 18,
            fontWeight: 700,
            color: KL.text,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "5px 0 0",
            fontFamily: KL.font,
            fontSize: 14.5,
            lineHeight: 1.55,
            color: KL.textSec,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}
function Showcase() {
  const m = useMobile();
  return (
    <Section id="features">
      <div style={{ textAlign: "center", marginBottom: m ? 36 : 56 }}>
        <Eyebrow>For athletes</Eyebrow>
        <H2 center m={m}>
          Plan, generate, sync.
        </H2>
        <p
          style={{
            margin: "14px auto 0",
            maxWidth: 520,
            fontFamily: KL.font,
            fontSize: 16.5,
            lineHeight: 1.55,
            color: KL.textSec,
          }}
        >
          A complete toolkit for athletes and coaches — running entirely in your
          browser.
        </p>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: m ? "column" : "row",
          gap: m ? 36 : 56,
          alignItems: "center",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            justifyContent: "center",
            order: m ? 0 : 1,
          }}
        >
          <EditorPhone />
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: 26, flex: 1 }}
        >
          <FeatureRow
            icon="cpu"
            tone={KL.blueBright}
            title="Visual workout editor"
            desc="Drag-and-drop steps, intervals, and targets into structured sessions. Real-time validation and stats."
          />
          <FeatureRow
            icon="sparkle"
            tone={KL.purple}
            title="AI workout generation"
            desc="Describe a session in plain language — Kaiord builds it around your power, HR, and pace zones with Claude, GPT, or Gemini."
          />
          <FeatureRow
            icon="watch"
            tone={KL.tip}
            title="One-tap Garmin sync"
            desc="Push planned workouts straight to your watch, and pull completed activities back — no server in between."
          />
        </div>
      </div>
    </Section>
  );
}

// ── FORMAT HUB (redesigned radial) ──────────────────────────────────
function FormatHub() {
  const m = useMobile();
  const formats = [".FIT", ".TCX", ".ZWO", ".GCN"];
  const Chip = ({ label, style }) => (
    <span
      style={{
        position: "absolute",
        fontFamily: KL.mono,
        fontSize: 14,
        fontWeight: 700,
        color: KL.text,
        padding: "9px 14px",
        borderRadius: 11,
        border: `1px solid ${KL.border}`,
        background: KL.surface,
        boxShadow: "0 6px 18px rgba(0,0,0,.3)",
        ...style,
      }}
    >
      {label}
    </span>
  );
  const conn = { position: "absolute", background: `${KL.blue}66` };
  return (
    <Section>
      <div style={{ textAlign: "center", marginBottom: m ? 34 : 50 }}>
        <Eyebrow color={KL.muted}>The hub model</Eyebrow>
        <H2 center m={m}>
          One hub. Every format.
        </H2>
        <p
          style={{
            margin: "14px auto 0",
            maxWidth: 540,
            fontFamily: KL.font,
            fontSize: 16.5,
            lineHeight: 1.55,
            color: KL.textSec,
          }}
        >
          KRD is the canonical format. Every conversion flows through it —
          lossless and round-trip safe.
        </p>
      </div>
      {/* radial diagram */}
      <div
        style={{
          position: "relative",
          width: m ? 300 : 420,
          height: m ? 300 : 360,
          margin: "0 auto",
        }}
      >
        {/* connector lines */}
        <div
          style={{
            ...conn,
            left: "50%",
            top: "13%",
            width: 2,
            height: "27%",
            transform: "translateX(-50%)",
          }}
        />
        <div
          style={{
            ...conn,
            left: "50%",
            bottom: "13%",
            width: 2,
            height: "27%",
            transform: "translateX(-50%)",
          }}
        />
        <div
          style={{
            ...conn,
            top: "50%",
            left: "13%",
            height: 2,
            width: "27%",
            transform: "translateY(-50%)",
          }}
        />
        <div
          style={{
            ...conn,
            top: "50%",
            right: "13%",
            height: 2,
            width: "27%",
            transform: "translateY(-50%)",
          }}
        />
        {/* hub */}
        <div
          className="kl-pulse"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: m ? 84 : 96,
            height: m ? 84 : 96,
            borderRadius: 22,
            border: `2px solid ${KL.blue}`,
            background: `${KL.blue}1a`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 40px ${KL.blue}44`,
          }}
        >
          <span
            style={{
              fontFamily: KL.mono,
              fontSize: m ? 18 : 21,
              fontWeight: 800,
              color: KL.blueBright,
            }}
          >
            KRD
          </span>
        </div>
        {/* bidirectional markers */}
        {[
          ["↕", "50%", "30%", "translate(-50%,-50%)"],
          ["↕", "50%", "70%", "translate(-50%,-50%)"],
          ["↔", "30%", "50%", "translate(-50%,-50%)"],
          ["↔", "70%", "50%", "translate(-50%,-50%)"],
        ].map(([s, l, t, tr], i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: l,
              top: t,
              transform: tr,
              color: KL.muted,
              fontSize: 14,
            }}
          >
            {s}
          </span>
        ))}
        {/* format chips */}
        <Chip
          label={formats[0]}
          style={{ left: "50%", top: 0, transform: "translateX(-50%)" }}
        />
        <Chip
          label={formats[1]}
          style={{ left: 0, top: "50%", transform: "translateY(-50%)" }}
        />
        <Chip
          label={formats[2]}
          style={{ right: 0, top: "50%", transform: "translateY(-50%)" }}
        />
        <Chip
          label={formats[3]}
          style={{ left: "50%", bottom: 0, transform: "translateX(-50%)" }}
        />
      </div>
    </Section>
  );
}

// ── DEVELOPERS ──────────────────────────────────────────────────────
const PM = {
  npm: "npm i @kaiord/core",
  yarn: "yarn add @kaiord/core",
  pnpm: "pnpm add @kaiord/core",
  bun: "bun add @kaiord/core",
};
function InstallWidget() {
  const [pm, setPm] = React.useState("npm");
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard && navigator.clipboard.writeText(PM[pm]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 12,
        border: `1px solid ${KL.border}`,
        background: KL.surface,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex" }}>
        {Object.keys(PM).map((k) => (
          <button
            key={k}
            onClick={() => setPm(k)}
            style={{
              padding: "12px 14px",
              border: "none",
              cursor: "pointer",
              borderRight: `1px solid ${KL.border}`,
              background: pm === k ? KL.bg : "transparent",
              color: pm === k ? KL.text : KL.muted,
              fontFamily: KL.font,
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {k}
          </button>
        ))}
      </div>
      <code
        style={{
          padding: "12px 16px",
          fontFamily: KL.mono,
          fontSize: 14,
          color: KL.textSec,
        }}
      >
        {PM[pm]}
      </code>
      <button
        onClick={copy}
        style={{
          padding: "12px 14px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: copied ? KL.tip : KL.muted,
          display: "flex",
        }}
      >
        <LIcon name={copied ? "check" : "copy"} size={16} sw={2} />
      </button>
    </div>
  );
}
function CapCard({ mark, title, desc, tone }) {
  return (
    <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          flexShrink: 0,
          background: `${tone}1a`,
          color: tone,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: KL.mono,
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {mark}
      </div>
      <div>
        <h3
          style={{
            margin: 0,
            fontFamily: KL.font,
            fontSize: 15.5,
            fontWeight: 700,
            color: KL.text,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "3px 0 0",
            fontFamily: KL.font,
            fontSize: 13.5,
            lineHeight: 1.5,
            color: KL.textSec,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}
function Developers() {
  const m = useMobile();
  const caps = [
    {
      mark: "TS",
      tone: KL.blueBright,
      title: "TypeScript-first",
      desc: "Strict types, Zod schemas, full IntelliSense. No any.",
    },
    {
      mark: "⬡",
      tone: KL.purple,
      title: "Hexagonal architecture",
      desc: "Clean boundaries. Domain never depends on infrastructure.",
    },
    {
      mark: "⚙",
      tone: KL.tip,
      title: "Plugin system",
      desc: "Strategy pattern: inject your own readers and writers.",
    },
    {
      mark: ">_",
      tone: "#fbbf24",
      title: "CLI",
      desc: "Convert files from your terminal. Pipe-friendly.",
    },
    {
      mark: "AI",
      tone: "#f472b6",
      title: "MCP server",
      desc: "AI-ready via Model Context Protocol — Claude, Cursor & more.",
    },
    {
      mark: "5",
      tone: "#22d3ee",
      title: "5 format adapters",
      desc: "FIT, TCX, ZWO, GCN, KRD. All round-trip safe.",
    },
  ];
  return (
    <Section id="developers">
      <div style={{ textAlign: "center", marginBottom: m ? 32 : 46 }}>
        <Eyebrow color={KL.purple}>For developers</Eyebrow>
        <H2 center m={m}>
          Convert fitness data in 4 lines.
        </H2>
        <p
          style={{
            margin: "14px auto 22px",
            maxWidth: 520,
            fontFamily: KL.font,
            fontSize: 16.5,
            lineHeight: 1.55,
            color: KL.textSec,
          }}
        >
          Strategy pattern — bring your own adapters. Type-safe end to end.
        </p>
        <InstallWidget />
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto 44px" }}>
        <CodeBlock />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: m ? "1fr" : "repeat(3, 1fr)",
          gap: m ? 22 : 30,
        }}
      >
        {caps.map((c) => (
          <CapCard key={c.title} {...c} />
        ))}
      </div>
    </Section>
  );
}

// ── DIFFERENTIATORS ─────────────────────────────────────────────────
function Differentiators() {
  const m = useMobile();
  return (
    <Section>
      <div
        style={{
          borderRadius: 22,
          border: `1px solid ${KL.blue}40`,
          background: `${KL.blue}0d`,
          padding: m ? 26 : 44,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: 999,
            background: `radial-gradient(closest-side, ${KL.blue}22, transparent)`,
          }}
        />
        <div style={{ position: "relative", maxWidth: 620 }}>
          <Badge icon="cpu" color={KL.blueBright}>
            Zero infrastructure
          </Badge>
          <h3
            style={{
              margin: "16px 0 0",
              fontFamily: KL.font,
              fontSize: m ? 24 : 30,
              fontWeight: 800,
              letterSpacing: "-.02em",
              color: KL.text,
            }}
          >
            No servers. No accounts. No cloud.
          </h3>
          <p
            style={{
              margin: "12px 0 0",
              fontFamily: KL.font,
              fontSize: 16,
              lineHeight: 1.6,
              color: KL.textSec,
            }}
          >
            Everything runs locally or in-browser. The CLI converts files on
            your machine, the editor runs in your browser, the MCP server plugs
            into your local AI tools. Your data never leaves your device.
          </p>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 20 }}
          >
            {["CLI", "SPA editor", "MCP", "Browser extension"].map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: KL.mono,
                  fontSize: 12.5,
                  color: KL.textSec,
                  padding: "6px 11px",
                  borderRadius: 8,
                  background: KL.surface,
                  border: `1px solid ${KL.border}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* honest AI-coded note, toned down */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          justifyContent: "center",
          marginTop: 26,
          flexWrap: "wrap",
          textAlign: "center",
        }}
      >
        <LIcon name="sparkle" size={16} color={KL.purple} />
        <span style={{ fontFamily: KL.font, fontSize: 14, color: KL.muted }}>
          Every line — domain, adapters, editor, this page — written by AI
          agents.
        </span>
        <span
          style={{
            fontFamily: KL.font,
            fontSize: 14,
            fontWeight: 600,
            color: KL.purple,
            cursor: "pointer",
          }}
        >
          See the commits →
        </span>
      </div>
    </Section>
  );
}

// ── OPEN SOURCE ─────────────────────────────────────────────────────
function OpenSource() {
  const m = useMobile();
  const stats = [
    { v: "5", l: "Format adapters", c: KL.blueBright },
    { v: "100%", l: "Round-trip safe", c: KL.tip },
    { v: "MIT", l: "Licensed", c: KL.purple },
    { v: "0", l: "Backend services", c: "#fbbf24" },
  ];
  return (
    <Section id="open-source">
      <div style={{ textAlign: "center" }}>
        <Eyebrow color={KL.muted}>Open source</Eyebrow>
        <H2 center m={m}>
          Built in the open.
        </H2>
        <p
          style={{
            margin: "14px auto 0",
            maxWidth: 460,
            fontFamily: KL.font,
            fontSize: 16.5,
            lineHeight: 1.55,
            color: KL.textSec,
          }}
        >
          MIT licensed. Contributions welcome.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: m ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 14,
            margin: "36px 0",
          }}
        >
          {stats.map((s) => (
            <div
              key={s.l}
              style={{
                borderRadius: 16,
                border: `1px solid ${KL.border}`,
                background: KL.surface,
                padding: "20px 14px",
              }}
            >
              <div
                style={{
                  fontFamily: KL.font,
                  fontSize: 30,
                  fontWeight: 800,
                  color: s.c,
                  letterSpacing: "-.02em",
                }}
              >
                {s.v}
              </div>
              <div
                style={{
                  fontFamily: KL.font,
                  fontSize: 12.5,
                  color: KL.muted,
                  marginTop: 4,
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
        <LBtn variant="ghost" size="lg">
          ★ Star on GitHub
        </LBtn>
      </div>
    </Section>
  );
}

// ── FOOTER ──────────────────────────────────────────────────────────
function Footer() {
  const m = useMobile();
  return (
    <footer
      style={{
        borderTop: `1px solid ${KL.border}`,
        padding: m ? "36px 22px" : "44px 48px",
      }}
    >
      <Container>
        <div
          style={{
            display: "flex",
            flexDirection: m ? "column" : "row",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Logo size={20} color={KL.muted} spokes={false} />
            <span
              style={{
                fontFamily: KL.font,
                fontSize: 14,
                fontWeight: 700,
                color: KL.muted,
              }}
            >
              kaiord
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 22,
              fontFamily: KL.font,
              fontSize: 14,
              color: KL.muted,
            }}
          >
            <span>GitHub</span>
            <span>npm</span>
            <span>MIT License</span>
          </div>
          <div style={{ fontFamily: KL.font, fontSize: 14, color: KL.muted }}>
            Built by{" "}
            <span style={{ color: KL.textSec, fontWeight: 600 }}>
              Pablo Albaladejo
            </span>
          </div>
        </div>
        <p
          style={{
            marginTop: 24,
            textAlign: "center",
            fontFamily: KL.font,
            fontSize: 12,
            color: KL.muted,
          }}
        >
          Cookieless analytics — no personal data collected.
        </p>
      </Container>
    </footer>
  );
}

// ── PAGE ────────────────────────────────────────────────────────────
function LandingPage() {
  return (
    <div style={{ background: KL.bg, minHeight: "100vh" }}>
      <Nav />
      <main>
        <Hero />
        <Showcase />
        <FormatHub />
        <Developers />
        <Differentiators />
        <OpenSource />
      </main>
      <Footer />
    </div>
  );
}

Object.assign(window, { LandingPage });
