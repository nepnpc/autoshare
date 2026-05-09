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
    icon: "⬡",
    title: "Connect GitHub",
    desc: "One click OAuth. GitHub becomes your secure vault — not us.",
  },
  {
    n: "02",
    icon: "⬡",
    title: "Add your accounts",
    desc: "Enter all Meroshare accounts. DP, username, password, CRN, PIN.",
  },
  {
    n: "03",
    icon: "⬡",
    title: "Wake up to allotments",
    desc: "Bot runs 6:15 AM daily. Only Ordinary Shares. Never mutual funds.",
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

      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(57,211,83,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(57,211,83,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }} />

      {/* Radial glow top */}
      <div style={{
        position: "fixed", top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: "800px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(35,134,54,0.15) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Ticker */}
      <div style={{
        borderBottom: "1px solid var(--border)", background: "rgba(7,21,16,0.9)",
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
        backdropFilter: "blur(8px)", background: "rgba(4,14,8,0.7)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "6px",
            background: "linear-gradient(135deg, var(--green), var(--bright))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.875rem",
          }}>📈</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--text)" }}>
            AutoShare
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: "0.65rem",
            background: "rgba(57,211,83,0.1)", border: "1px solid var(--border-hi)",
            color: "var(--bright)", padding: "0.15rem 0.5rem", borderRadius: "999px",
          }}>BETA</span>
        </div>
        <button onClick={handleConnect} disabled={loading} style={{
          fontFamily: "'Outfit', sans-serif", fontSize: "0.875rem", fontWeight: 500,
          padding: "0.5rem 1.25rem", borderRadius: "6px",
          background: "transparent", border: "1px solid var(--border-hi)",
          color: "var(--bright)", cursor: "pointer",
          transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(57,211,83,0.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
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
          background: "rgba(57,211,83,0.05)", border: "1px solid var(--border)",
          padding: "0.4rem 1rem", borderRadius: "999px", marginBottom: "2rem",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--bright)", display: "inline-block", animation: "pulseGlow 2s ease infinite" }} />
          BOT RUNNING DAILY · 6:15 AM NST
        </div>

        <h1 className="anim-fade-up anim-delay-1" style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: "clamp(3rem, 8vw, 6.5rem)", lineHeight: 1,
          color: "var(--text)", marginBottom: "0.75rem",
          letterSpacing: "-0.02em",
        }}>
          Never miss<br />
          <span style={{
            background: "linear-gradient(135deg, var(--glow), var(--bright))",
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
          Your password never leaves GitHub's encrypted secrets vault.
        </p>

        <div className="anim-fade-up anim-delay-3" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={handleConnect} disabled={loading} style={{
            display: "flex", alignItems: "center", gap: "0.625rem",
            padding: "0.875rem 2rem", borderRadius: "8px",
            fontSize: "1rem", fontWeight: 600, fontFamily: "'Outfit', sans-serif",
            background: "linear-gradient(135deg, var(--green), var(--glow))",
            color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 0 32px rgba(35,134,54,0.4)",
            transition: "all 0.2s", opacity: loading ? 0.7 : 1,
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 48px rgba(57,211,83,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 32px rgba(35,134,54,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <GitHubIcon />
            {loading ? "Connecting…" : "Connect with GitHub — Free"}
          </button>
        </div>

        {/* Stats row */}
        <div className="anim-fade-up anim-delay-4" style={{
          display: "flex", gap: "3rem", marginTop: "4rem",
          flexWrap: "wrap", justifyContent: "center",
        }}>
          {[
            { n: "8+", label: "Accounts per user" },
            { n: "100%", label: "Free forever" },
            { n: "6:15", label: "AM NST daily run" },
          ].map(({ n, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: "2rem", color: "var(--bright)",
              }}>{n}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "var(--dim)", letterSpacing: "0.05em" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section style={{
        position: "relative", zIndex: 5,
        padding: "4rem 2rem 6rem", maxWidth: "1000px", margin: "0 auto",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "1rem", marginBottom: "3rem",
        }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "var(--dim)", letterSpacing: "0.12em" }}>HOW IT WORKS</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {STEPS.map(({ n, title, desc }, i) => (
            <div key={n} className={`anim-fade-up anim-delay-${i + 2}`} style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "12px", padding: "2rem",
              position: "relative", overflow: "hidden",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hi)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 32px rgba(57,211,83,0.08)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: "0.7rem",
                color: "var(--bright)", letterSpacing: "0.1em", marginBottom: "1.25rem",
                opacity: 0.7,
              }}>{n}</div>
              <h3 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: "1.2rem", color: "var(--text)", marginBottom: "0.75rem",
              }}>{title}</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.7 }}>{desc}</p>
              {/* Corner accent */}
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: "80px", height: "80px",
                background: "radial-gradient(circle at 100% 100%, rgba(57,211,83,0.06) 0%, transparent 70%)",
              }} />
            </div>
          ))}
        </div>
      </section>

      {/* Security strip */}
      <div style={{
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
        background: "rgba(8,28,16,0.5)", padding: "1.5rem 2rem",
        display: "flex", justifyContent: "center", gap: "3rem",
        flexWrap: "wrap", position: "relative", zIndex: 5,
      }}>
        {[
          "🔒  Password encrypted by GitHub Secrets API",
          "👻  Credentials never stored on AutoShare servers",
          "🔓  Delete your repo anytime to fully revoke",
        ].map(t => (
          <span key={t} style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "var(--dim)", letterSpacing: "0.04em" }}>{t}</span>
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

function GitHubIcon() {
  return (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
