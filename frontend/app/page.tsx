"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLoginUrl, isLoggedIn } from "@/lib/api";

const TICKER_ITEMS = [
  "TPKHL +12.4%", "NABIL +3.2%", "GBIME +8.7%", "SICL +5.1%",
  "UPPER +19.3%", "RURU +6.8%", "MERO +4.4%", "CHDC +11.2%",
  "SHINE +7.9%", "NRIC +2.6%", "HIDCL +9.1%", "NMB +3.8%",
];

const STEPS = [
  {
    n: "01",
    icon: <ConnectIcon />,
    title: "Connect GitHub",
    desc: "One click OAuth. GitHub becomes your secure vault — not us.",
    accent: "var(--blue)",
  },
  {
    n: "02",
    icon: <AccountIcon />,
    title: "Add your accounts",
    desc: "Enter all Meroshare accounts. DP, username, password, CRN, PIN.",
    accent: "var(--glow)",
  },
  {
    n: "03",
    icon: <BotIcon />,
    title: "Wake up to allotments",
    desc: "Bot runs 6:15 AM daily. Only Ordinary Shares. Never mutual funds.",
    accent: "var(--orange)",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isLoggedIn()) router.replace("/dashboard");
  }, [router]);

  async function handleConnect() {
    setLoading(true);
    try {
      const { url, state } = await getLoginUrl();
      sessionStorage.setItem("oauth_state", state);
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", overflow: "hidden" }}>

      {/* Grid background — subtle blue tint */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(29,111,235,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(29,111,235,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }} />

      {/* Dual glow — blue left + green right (matches logo) */}
      <div style={{
        position: "fixed", top: "-15%", left: "30%", transform: "translateX(-50%)",
        width: "700px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(29,111,235,0.18) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", top: "-10%", right: "-5%",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(34,197,94,0.10) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      {/* Orange accent glow — bottom left */}
      <div style={{
        position: "fixed", bottom: "-10%", left: "-5%",
        width: "400px", height: "400px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(240,136,62,0.07) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Ticker */}
      <div style={{
        borderBottom: "1px solid var(--border)",
        background: "rgba(13,17,23,0.95)",
        backdropFilter: "blur(8px)", overflow: "hidden", position: "relative", zIndex: 10,
        padding: "0.5rem 0",
      }}>
        <div style={{
          display: "flex", gap: "3rem", whiteSpace: "nowrap",
          animation: "ticker 30s linear infinite",
          width: "max-content",
        }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{
              fontFamily: "'DM Mono', monospace", fontSize: "0.75rem",
              color: item.includes("+") ? "var(--bright)" : "var(--danger)",
              letterSpacing: "0.05em",
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.25rem 3rem", position: "relative", zIndex: 10,
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)", background: "rgba(13,17,23,0.82)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <LogoMark />
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "var(--text)", letterSpacing: "-0.01em" }}>
            <span style={{ color: "var(--blue-hi)" }}>Auto</span><span style={{ color: "var(--bright)" }}>Share</span>
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: "0.65rem",
            background: "rgba(29,111,235,0.12)", border: "1px solid var(--border-hi)",
            color: "var(--blue-hi)", padding: "0.15rem 0.5rem", borderRadius: "999px",
          }}>BETA</span>
        </div>
        <button onClick={handleConnect} disabled={loading} style={{
          fontFamily: "'Outfit', sans-serif", fontSize: "0.875rem", fontWeight: 500,
          padding: "0.5rem 1.25rem", borderRadius: "6px",
          background: "transparent", border: "1px solid var(--border-hi)",
          color: "var(--blue-hi)", cursor: "pointer",
          transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(29,111,235,0.1)"; e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--blue-hi)"; }}
        >
          {loading ? "…" : "Connect GitHub →"}
        </button>
      </nav>

      {/* Hero */}
      <section style={{
        position: "relative", zIndex: 5,
        padding: "7rem 2rem 5rem",
        textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>

        <div className="anim-fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          fontFamily: "'DM Mono', monospace", fontSize: "0.75rem",
          color: "var(--muted)", letterSpacing: "0.1em",
          background: "rgba(29,111,235,0.06)", border: "1px solid var(--border)",
          padding: "0.4rem 1rem", borderRadius: "999px", marginBottom: "2rem",
        }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "var(--bright)", display: "inline-block",
            animation: "pulseGlowGreen 2s ease infinite",
          }} />
          BOT RUNNING DAILY · 6:15 AM NST
        </div>

        <h1 className="anim-fade-up anim-delay-1" style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: "clamp(3rem, 8vw, 6.5rem)", lineHeight: 1,
          color: "var(--text)", marginBottom: "0.75rem",
          letterSpacing: "-0.03em",
        }}>
          Never miss<br />
          <span style={{
            background: "linear-gradient(135deg, var(--blue-hi) 0%, var(--bright) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>an IPO.</span>
        </h1>

        <p className="anim-fade-up anim-delay-2" style={{
          fontSize: "1.2rem", color: "var(--muted)", maxWidth: "480px",
          lineHeight: 1.7, marginBottom: "0.5rem",
        }}>
          AutoShare applies for every Nepal Ordinary Share IPO automatically.
          Daily. Free. Forever.
        </p>
        <p className="anim-fade-up anim-delay-2" style={{
          fontSize: "0.875rem", color: "var(--dim)", marginBottom: "3rem",
          fontFamily: "'DM Mono', monospace",
        }}>
          Your password never leaves GitHub&apos;s encrypted secrets vault.
        </p>

        <div className="anim-fade-up anim-delay-3" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={handleConnect} disabled={loading} style={{
            display: "flex", alignItems: "center", gap: "0.625rem",
            padding: "0.9rem 2.25rem", borderRadius: "10px",
            fontSize: "1rem", fontWeight: 600, fontFamily: "'Outfit', sans-serif",
            background: "linear-gradient(135deg, var(--blue) 0%, var(--glow) 100%)",
            color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 0 36px rgba(29,111,235,0.35), 0 0 60px rgba(34,197,94,0.12)",
            transition: "all 0.25s", opacity: loading ? 0.7 : 1,
            letterSpacing: "0.01em",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 0 56px rgba(29,111,235,0.5), 0 0 80px rgba(34,197,94,0.2)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "0 0 36px rgba(29,111,235,0.35), 0 0 60px rgba(34,197,94,0.12)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <GitHubIcon />
            {loading ? "Connecting…" : "Connect with GitHub — Free"}
          </button>
        </div>

        {/* Stats row — three logo colors */}
        <div className="anim-fade-up anim-delay-4" style={{
          display: "flex", gap: "4rem", marginTop: "4.5rem",
          flexWrap: "wrap", justifyContent: "center",
        }}>
          {[
            { n: "8+", label: "Accounts per user", color: "var(--blue-hi)" },
            { n: "100%", label: "Free forever", color: "var(--bright)" },
            { n: "6:15", label: "AM NST daily run", color: "var(--orange)" },
          ].map(({ n, label, color }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: "2.25rem", color,
                textShadow: `0 0 20px ${color}40`,
              }}>{n}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "var(--dim)", letterSpacing: "0.06em", marginTop: "0.25rem" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section style={{
        position: "relative", zIndex: 5,
        padding: "4rem 2rem 6rem", maxWidth: "1060px", margin: "0 auto",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "1rem", marginBottom: "3rem",
        }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "var(--dim)", letterSpacing: "0.12em" }}>HOW IT WORKS</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {STEPS.map(({ n, icon, title, desc, accent }, i) => (
            <div key={n} className={`anim-fade-up anim-delay-${i + 2}`} style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "14px", padding: "2rem",
              position: "relative", overflow: "hidden",
              transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
              cursor: "default",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = accent;
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 32px ${accent}18`;
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              {/* Step number */}
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: "0.68rem",
                color: accent, letterSpacing: "0.12em", marginBottom: "1.25rem",
                opacity: 0.8,
              }}>{n}</div>

              {/* Icon */}
              <div style={{ marginBottom: "1rem", color: accent }}>
                {icon}
              </div>

              <h3 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: "1.2rem", color: "var(--text)", marginBottom: "0.75rem",
              }}>{title}</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.7 }}>{desc}</p>

              {/* Corner gradient */}
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: "100px", height: "100px",
                background: `radial-gradient(circle at 100% 100%, ${accent}10 0%, transparent 70%)`,
              }} />
            </div>
          ))}
        </div>
      </section>

      {/* Security strip */}
      <div style={{
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
        background: "rgba(18,26,40,0.7)",
        backdropFilter: "blur(8px)",
        padding: "1.75rem 2rem",
        display: "flex", justifyContent: "center", gap: "3rem",
        flexWrap: "wrap", position: "relative", zIndex: 5,
      }}>
        {[
          { icon: <LockIcon />, text: "Password encrypted by GitHub Secrets API" },
          { icon: <ShieldIcon />, text: "Credentials never stored on AutoShare servers" },
          { icon: <UnlockIcon />, text: "Delete your repo anytime to fully revoke" },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <span style={{ color: "var(--blue-hi)", flexShrink: 0 }}>{icon}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "var(--muted)", letterSpacing: "0.04em" }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{
        padding: "2rem", textAlign: "center", position: "relative", zIndex: 5,
      }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "var(--dim)" }}>
          © 2026 AutoShare · Built for Nepal investors · Free forever
        </p>
      </footer>
    </main>
  );
}

/* ─── Icons ─────────────────────────────────────────────────────────── */

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lgBg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1565C0" />
          <stop offset="1" stopColor="#0D47A1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#lgBg)" />
      <rect x="6" y="20" width="4" height="6" rx="1" fill="rgba(255,255,255,0.4)" />
      <rect x="11" y="15" width="4" height="11" rx="1" fill="rgba(255,255,255,0.6)" />
      <rect x="16" y="10" width="4" height="16" rx="1" fill="rgba(255,255,255,0.85)" />
      <path d="M22 12 L26 8 M26 8 H22 M26 8 V12" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function ConnectIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" strokeWidth="2.5" />
      <line x1="16" y1="16" x2="16" y2="16" strokeWidth="2.5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}
