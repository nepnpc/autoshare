"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getLoginUrl, isLoggedIn } from "@/lib/api";
import { Suspense } from "react";

const STEP_META = [
  { n: "01", title: "Connect GitHub",         color: "#1d6feb", bg: "rgba(29,111,235,0.08)"  },
  { n: "02", title: "Add Meroshare accounts",  color: "#16a34a", bg: "rgba(22,163,74,0.08)"   },
  { n: "03", title: "Wake up to allotments",   color: "#ea580c", bg: "rgba(234,88,12,0.08)"   },
];

function LandingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (isLoggedIn()) router.replace("/dashboard");
    const err = params.get("error");
    if (err === "oauth_failed") setAuthError("GitHub sign-in failed. Please try again.");
  }, [router, params]);

  useEffect(() => {
    const t = setInterval(() => setActiveStep(p => (p + 1) % 3), 4500);
    return () => clearInterval(t);
  }, []);

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
    <main style={{ minHeight: "100vh", background: "#fff", overflow: "hidden" }}>

      {/* Subtle dot grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* Blue tint top */}
      <div style={{
        position: "fixed", top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: "800px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(29,111,235,0.06) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Nav */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1rem 3rem", position: "relative", zIndex: 10,
        borderBottom: "1px solid rgba(15,23,42,0.08)",
        backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.92)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <LogoMark />
          <span style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700, fontSize: "1.15rem" }}>
            <span style={{ color: "#1d6feb" }}>Auto</span><span style={{ color: "#16a34a" }}>Share</span>
          </span>
          <span style={{
            fontFamily: "'Roboto Mono', monospace", fontSize: "0.6rem",
            background: "rgba(29,111,235,0.1)", border: "1px solid rgba(29,111,235,0.25)",
            color: "#1d6feb", padding: "0.15rem 0.5rem", borderRadius: "999px",
          }}>BETA</span>
        </div>
        <button onClick={handleConnect} disabled={loading} style={{
          fontFamily: "'Roboto', sans-serif", fontSize: "0.875rem", fontWeight: 500,
          padding: "0.5rem 1.25rem", borderRadius: "6px",
          background: "transparent", border: "1px solid rgba(15,23,42,0.2)",
          color: "#475569", cursor: "pointer", transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#0f172a"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
        >
          {loading ? "…" : "Sign in →"}
        </button>
      </nav>

      {/* Hero */}
      <section style={{
        position: "relative", zIndex: 5,
        padding: "5rem 2rem 2rem",
        textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div className="anim-fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          fontFamily: "'Roboto Mono', monospace", fontSize: "0.7rem",
          color: "#16a34a", letterSpacing: "0.08em",
          background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)",
          padding: "0.4rem 1rem", borderRadius: "999px", marginBottom: "2rem",
        }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#16a34a", display: "inline-block",
            animation: "pulseGlowGreen 2s ease infinite",
          }} />
          ONE-TIME SETUP · RUNS FOREVER
        </div>

        <h1 className="anim-fade-up anim-delay-1" style={{
          fontFamily: "'Roboto', sans-serif", fontWeight: 700,
          fontSize: "clamp(2.75rem, 7vw, 5.5rem)", lineHeight: 1.1,
          color: "#0f172a", marginBottom: "0.75rem",
          letterSpacing: "-0.02em",
        }}>
          Never miss<br />
          <span style={{
            background: "linear-gradient(135deg, #1d6feb 0%, #16a34a 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>an IPO.</span>
        </h1>

        <p className="anim-fade-up anim-delay-2" style={{
          fontFamily: "'Roboto', sans-serif", fontWeight: 300,
          fontSize: "1.15rem", color: "#475569", maxWidth: "460px",
          lineHeight: 1.7, marginBottom: "0.75rem",
        }}>
          Never miss to apply an IPO — every Ordinary Share, every account, every morning. Automatically.
        </p>
        <p className="anim-fade-up anim-delay-2" style={{
          fontSize: "0.8rem", color: "#94a3b8", marginBottom: "3rem",
          fontFamily: "'Roboto Mono', monospace",
        }}>
          Your password never leaves GitHub&apos;s encrypted secrets vault.
        </p>

        {authError && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px",
            padding: "0.75rem 1.25rem", marginBottom: "1rem", color: "#dc2626",
            fontFamily: "'Roboto Mono', monospace", fontSize: "0.78rem", textAlign: "center",
          }}>
            {authError}
          </div>
        )}

        <div className="anim-fade-up anim-delay-3" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.875rem", marginBottom: "5rem" }}>
          <button onClick={handleConnect} disabled={loading} style={{
            display: "flex", alignItems: "center", gap: "0.625rem",
            padding: "0.875rem 2.25rem", borderRadius: "10px",
            fontSize: "1rem", fontWeight: 500, fontFamily: "'Roboto', sans-serif",
            background: "linear-gradient(135deg, #1d6feb 0%, #16a34a 100%)",
            color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 20px rgba(29,111,235,0.25)",
            transition: "all 0.25s", opacity: loading ? 0.7 : 1,
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 30px rgba(29,111,235,0.35)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(29,111,235,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <GitHubIcon />
            {loading ? "Connecting…" : "Connect with GitHub — Free"}
          </button>
          <p style={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.68rem", color: "#94a3b8", letterSpacing: "0.04em" }}>
            ✓ One-time setup &nbsp;·&nbsp; No daily actions &nbsp;·&nbsp; Free forever
          </p>
        </div>

        {/* Stats */}
        <div className="anim-fade-up anim-delay-5" style={{
          display: "flex", gap: "4rem", marginBottom: "5rem",
          flexWrap: "wrap", justifyContent: "center",
        }}>
          {[
            { n: "8+",   label: "Accounts per user", color: "#1d6feb" },
            { n: "100%", label: "Free forever",       color: "#16a34a" },
            { n: "0",    label: "IPOs you will miss", color: "#ea580c" },
          ].map(({ n, label, color }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700, fontSize: "2.25rem", color }}>{n}</div>
              <div style={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.7rem", color: "#94a3b8", letterSpacing: "0.04em", marginTop: "0.25rem" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS — animated demo */}
      <section style={{
        position: "relative", zIndex: 5,
        padding: "0 2rem 7rem", maxWidth: "900px", margin: "0 auto",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "3.5rem", width: "100%" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(15,23,42,0.1)" }} />
          <span style={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.7rem", color: "#94a3b8", letterSpacing: "0.1em" }}>HOW IT WORKS</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(15,23,42,0.1)" }} />
        </div>

        {/* Animated Window */}
        <div style={{
          width: "100%", maxWidth: "560px",
          animation: "float 6s ease-in-out infinite",
          marginBottom: "2.5rem",
          borderRadius: "14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
          border: "1px solid rgba(15,23,42,0.1)",
        }}>
          {/* Window chrome */}
          <div style={{
            background: "#f1f5f9",
            borderRadius: "14px 14px 0 0",
            borderBottom: "1px solid rgba(15,23,42,0.08)",
            padding: "0.75rem 1rem",
            display: "flex", alignItems: "center", gap: "0.75rem",
          }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {["#ff5f57","#febc2e","#28c840"].map(c => (
                <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div style={{
              flex: 1, background: "#fff",
              border: "1px solid rgba(15,23,42,0.1)",
              borderRadius: "6px", padding: "0.3rem 0.75rem",
              fontFamily: "'Roboto Mono', monospace", fontSize: "0.7rem", color: "#94a3b8",
              textAlign: "center",
            }}>
              {activeStep === 0 ? "github.com/login/oauth/authorize" :
               activeStep === 1 ? "autoshare.app/setup" :
               "github.com/actions · AutoShare IPO Bot"}
            </div>
          </div>

          {/* Window content */}
          <div style={{
            background: "#fff",
            borderRadius: "0 0 14px 14px",
            minHeight: "340px", overflow: "hidden",
          }}>
            {activeStep === 0 && <SceneGitHub key="gh" />}
            {activeStep === 1 && <SceneCredentials key="creds" />}
            {activeStep === 2 && <SceneBot key="bot" />}
          </div>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          {STEP_META.map((s, i) => (
            <button key={i} onClick={() => setActiveStep(i)} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: i === activeStep ? s.bg : "transparent",
              border: `1px solid ${i === activeStep ? s.color + "40" : "rgba(15,23,42,0.12)"}`,
              borderRadius: "999px",
              padding: "0.4rem 0.875rem",
              cursor: "pointer", transition: "all 0.3s",
            }}>
              <span style={{
                fontFamily: "'Roboto Mono', monospace", fontSize: "0.62rem",
                color: i === activeStep ? s.color : "#94a3b8",
              }}>{s.n}</span>
              <span style={{
                fontFamily: "'Roboto', sans-serif", fontSize: "0.8rem",
                color: i === activeStep ? s.color : "#475569",
                fontWeight: i === activeStep ? 500 : 400,
              }}>{s.title}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Security strip */}
      <div style={{
        borderTop: "1px solid rgba(15,23,42,0.08)",
        borderBottom: "1px solid rgba(15,23,42,0.08)",
        background: "#f8fafc",
        padding: "1.75rem 2rem",
        display: "flex", justifyContent: "center", gap: "3rem",
        flexWrap: "wrap", position: "relative", zIndex: 5,
      }}>
        {[
          { icon: <LockIcon />,   text: "Password encrypted by GitHub Secrets API" },
          { icon: <ShieldIcon />, text: "Credentials never stored on AutoShare servers" },
          { icon: <UnlockIcon />, text: "Delete your repo anytime to fully revoke" },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <span style={{ color: "#1d6feb", flexShrink: 0 }}>{icon}</span>
            <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: "0.82rem", color: "#475569" }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ padding: "2.5rem 2rem", textAlign: "center", position: "relative", zIndex: 5, borderTop: "1px solid rgba(15,23,42,0.08)" }}>
        <p style={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.65rem", color: "#94a3b8", marginBottom: "1.25rem", letterSpacing: "0.06em" }}>
          BUILT BY
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <a href="https://github.com/nepnpc" target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 1rem", borderRadius: "8px",
            background: "#f8fafc", border: "1px solid rgba(15,23,42,0.12)",
            color: "#475569", textDecoration: "none",
            fontFamily: "'Roboto Mono', monospace", fontSize: "0.78rem",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(15,23,42,0.25)"; (e.currentTarget as HTMLAnchorElement).style.color = "#0f172a"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(15,23,42,0.12)"; (e.currentTarget as HTMLAnchorElement).style.color = "#475569"; }}
          >
            <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            nepnpc
          </a>
          <a href="mailto:hello@subarnakatwal.com.np" style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 1rem", borderRadius: "8px",
            background: "#f8fafc", border: "1px solid rgba(15,23,42,0.12)",
            color: "#475569", textDecoration: "none",
            fontFamily: "'Roboto Mono', monospace", fontSize: "0.78rem",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(15,23,42,0.25)"; (e.currentTarget as HTMLAnchorElement).style.color = "#0f172a"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(15,23,42,0.12)"; (e.currentTarget as HTMLAnchorElement).style.color = "#475569"; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            hello@subarnakatwal.com.np
          </a>
        </div>
        <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: "0.75rem", color: "#94a3b8" }}>
          © 2026 AutoShare · Built for Nepal investors · Free forever
        </p>
      </footer>
    </main>
  );
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingInner />
    </Suspense>
  );
}

/* ─── Scene 1: GitHub OAuth ──────────────────────────────────────────── */
function SceneGitHub() {
  return (
    <div style={{ padding: "2.5rem 2rem", animation: "sceneFadeIn 0.5s ease both" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.75rem" }}>
        <svg width="40" height="40" fill="#24292f" viewBox="0 0 24 24" style={{ marginBottom: "0.75rem" }}>
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
        <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: "0.85rem", color: "#475569", textAlign: "center" }}>
          <strong style={{ color: "#0f172a" }}>AutoShare</strong> by nepnpc wants access to:
        </p>
      </div>
      <div style={{ marginBottom: "1.75rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {[
          { label: "Read & write repositories",         delay: "0.1s" },
          { label: "Read & write Actions secrets",      delay: "0.25s" },
          { label: "Trigger GitHub Actions workflows",  delay: "0.4s" },
        ].map(({ label, delay }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.6rem 0.875rem",
            background: "rgba(29,111,235,0.05)", borderRadius: "8px",
            border: "1px solid rgba(29,111,235,0.15)",
            animation: "sceneFadeIn 0.4s ease both", animationDelay: delay,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: "0.82rem", color: "#475569" }}>{label}</span>
          </div>
        ))}
      </div>
      <button style={{
        width: "100%", padding: "0.8rem",
        background: "#1d6feb", border: "none", borderRadius: "8px", color: "#fff",
        fontFamily: "'Roboto', sans-serif", fontWeight: 500, fontSize: "0.95rem",
        cursor: "pointer", animation: "authPulse 2s ease-in-out infinite",
      }}>
        Authorize AutoShare
      </button>
    </div>
  );
}

/* ─── Scene 2: Meroshare Credentials ────────────────────────────────── */
function SceneCredentials() {
  return (
    <div style={{ padding: "2rem", animation: "sceneFadeIn 0.5s ease both" }}>
      <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0f172a", marginBottom: "1.5rem" }}>
        Add your Meroshare account
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.5rem" }}>
        {[
          { label: "DP Code",  value: "13007",    delay: "0s",   mono: true  },
          { label: "Username", value: "10001234", delay: "0.3s", mono: false },
          { label: "Password", value: "••••••••", delay: "0.6s", mono: false },
          { label: "CRN",      value: "SXXXXX…",  delay: "0.9s", mono: true  },
        ].map(({ label, value, delay, mono }) => (
          <div key={label} style={{ animation: "sceneFadeIn 0.4s ease both", animationDelay: delay }}>
            <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: "0.72rem", color: "#64748b", fontWeight: 500, marginBottom: "0.3rem" }}>{label}</p>
            <div style={{
              padding: "0.55rem 0.875rem",
              background: "#f8fafc", border: "1px solid rgba(29,111,235,0.35)",
              borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontFamily: mono ? "'Roboto Mono', monospace" : "'Roboto', sans-serif", fontSize: "0.88rem", color: "#0f172a" }}>{value}</span>
              <span style={{ display: "inline-block", width: "2px", height: "16px", background: "#1d6feb", animation: "cursorBlink 1s ease infinite" }} />
            </div>
          </div>
        ))}
      </div>
      <button style={{
        width: "100%", padding: "0.8rem",
        background: "linear-gradient(135deg, #1d6feb 0%, #16a34a 100%)",
        border: "none", borderRadius: "8px", color: "#fff",
        fontFamily: "'Roboto', sans-serif", fontWeight: 500, fontSize: "0.95rem",
        cursor: "pointer", boxShadow: "0 4px 16px rgba(29,111,235,0.25)",
        animation: "sceneFadeIn 0.4s ease both", animationDelay: "1.1s",
      }}>
        Activate Bot →
      </button>
    </div>
  );
}

/* ─── Scene 3: Bot Running ───────────────────────────────────────────── */
function SceneBot() {
  const lines = [
    { text: "$ docker run ghcr.io/nepnpc/autoshare-bot", color: "#64748b", delay: "0s"   },
    { text: "> Checking open IPOs...",                   color: "#475569", delay: "0.4s"  },
    { text: "✓ NRIC Hydropower IPO",                    color: "#16a34a", delay: "0.9s"  },
    { text: "  Applied successfully",                   color: "#64748b", delay: "1.1s"  },
    { text: "✓ Kumari Life Insurance IPO",              color: "#16a34a", delay: "1.6s"  },
    { text: "  Applied successfully",                   color: "#64748b", delay: "1.8s"  },
    { text: "> Done. 2/2 IPOs applied.",                color: "#ea580c", delay: "2.3s"  },
  ];
  return (
    <div style={{ padding: "1.75rem 2rem", animation: "sceneFadeIn 0.5s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", display: "inline-block", animation: "pulseGlowGreen 2s ease infinite" }} />
        <span style={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.7rem", color: "#475569", letterSpacing: "0.06em" }}>
          AUTOSHARE IPO BOT · RUNNING
        </span>
      </div>
      <div style={{
        background: "#1e293b", borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "1.25rem", fontFamily: "'Roboto Mono', monospace", fontSize: "0.8rem",
        display: "flex", flexDirection: "column", gap: "0.45rem",
      }}>
        {lines.map(({ text, color, delay }) => (
          <div key={text} style={{
            color, opacity: 0,
            animation: "logIn 0.3s ease both",
            animationDelay: delay, animationFillMode: "forwards",
          }}>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Shared ─────────────────────────────────────────────────────────── */
function LogoMark() {
  return (
    <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", background: "#fff", border: "1px solid rgba(15,23,42,0.1)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img src="/logo.png" alt="AutoShare" width={34} height={34} style={{ objectFit: "contain", display: "block" }} />
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LockIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
}
function ShieldIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}
function UnlockIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>;
}
