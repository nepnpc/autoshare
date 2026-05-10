"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, saveCredentials, getAccounts } from "@/lib/api";

type Account = { dp: string; meroshare_user: string; meroshare_pass: string; crn: string; pin: string };

const BLANK: Account = { dp: "", meroshare_user: "", meroshare_pass: "", crn: "", pin: "" };

export default function SetupPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([{ ...BLANK }]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn()) { router.replace("/"); return; }
    getAccounts()
      .then(({ accounts: existing }) => {
        if (existing.length > 0) {
          setIsEditing(true);
          setAccounts(existing.map(a => ({ ...BLANK, dp: a.dp, meroshare_user: a.meroshare_user, crn: a.crn || "" })));
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [router]);

  function setField(idx: number, field: keyof Account, value: string) {
    setAccounts(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  }

  function addAccount() {
    setAccounts(prev => [...prev, { ...BLANK }]);
  }

  function removeAccount(idx: number) {
    setAccounts(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (let i = 0; i < accounts.length; i++) {
      const a = accounts[i];
      if (!a.dp || !a.meroshare_user || !a.meroshare_pass || !a.crn || !a.pin) {
        setError(`Account ${i + 1}: all fields are required`);
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      await saveCredentials({ accounts });
      router.replace(isEditing ? "/dashboard" : "/dashboard?setup=done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setLoading(false);
    }
  }

  if (!mounted || fetching) return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2px solid var(--border-hi)", borderTopColor: "var(--blue)", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "var(--muted)", letterSpacing: "0.1em" }}>LOADING…</span>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", overflow: "hidden", position: "relative" }}>

      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(240,246,252,0.04) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      {/* Glow */}
      <div style={{
        position: "fixed", top: "-10%", left: "50%", transform: "translateX(-50%)",
        width: "600px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(29,111,235,0.10) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", top: "-5%", right: "-5%",
        width: "350px", height: "350px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(34,197,94,0.07) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Nav */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.25rem 3rem", position: "relative", zIndex: 10,
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)", background: "rgba(13,17,23,0.82)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <LogoMark />
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.01em" }}>
            <span style={{ color: "var(--blue-hi)" }}>Auto</span><span style={{ color: "var(--bright)" }}>Share</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {isEditing && (
            <a href="/dashboard" style={{
              fontFamily: "'DM Mono', monospace", fontSize: "0.72rem",
              color: "var(--muted)", letterSpacing: "0.06em",
              textDecoration: "none", border: "1px solid var(--border)",
              padding: "0.35rem 0.875rem", borderRadius: "6px",
              transition: "all 0.15s", cursor: "pointer",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-hi)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"; }}
            >← Dashboard</a>
          )}
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: "0.7rem",
            color: "var(--dim)", letterSpacing: "0.08em",
          }}>
            {isEditing ? "MANAGE ACCOUNTS" : "STEP 2 OF 2"}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 5, padding: "3rem 1.5rem 4rem", maxWidth: "640px", margin: "0 auto" }}>

        {/* Header */}
        <div className="anim-fade-up" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            fontFamily: "'DM Mono', monospace", fontSize: "0.7rem",
            color: "var(--muted)", letterSpacing: "0.12em",
            background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)",
            padding: "0.35rem 0.875rem", borderRadius: "999px", marginBottom: "1.25rem",
          }}>
            <span style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: "var(--bright)", display: "inline-block",
              animation: "pulseGlowGreen 2s ease infinite",
            }} />
            {isEditing ? "EDIT ACCOUNTS · ENCRYPTED BY GITHUB" : "SECURE SETUP · ENCRYPTED BY GITHUB"}
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: "clamp(1.75rem, 5vw, 2.5rem)", lineHeight: 1.1,
            color: "var(--text)", marginBottom: "0.75rem", letterSpacing: "-0.02em",
          }}>
            {isEditing ? "Manage your" : "Add your"}<br />
            <span style={{
              background: "linear-gradient(135deg, var(--blue-hi), var(--bright))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Meroshare accounts</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
            {isEditing
              ? "DP and username are pre-filled. Re-enter password, CRN, and PIN to save."
              : "Bot applies for every Ordinary Share IPO — each account, every morning."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {accounts.map((acct, idx) => (
            <div key={idx} className="anim-fade-up" style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "14px", padding: "1.5rem",
              marginBottom: "1rem", position: "relative",
              transition: "border-color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hi)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"}
            >
              {/* Corner accent */}
              <div style={{
                position: "absolute", top: 0, right: 0,
                width: "100px", height: "100px",
                background: "radial-gradient(circle at 100% 0%, rgba(29,111,235,0.07) 0%, transparent 70%)",
                borderRadius: "14px", pointerEvents: "none",
              }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: "0.65rem",
                    color: "var(--blue-hi)", letterSpacing: "0.1em",
                    background: "rgba(29,111,235,0.1)", border: "1px solid var(--border-hi)",
                    padding: "0.2rem 0.6rem", borderRadius: "999px",
                  }}>
                    ACCOUNT {String(idx + 1).padStart(2, "0")}
                  </div>
                  {isEditing && acct.meroshare_user && !acct.meroshare_pass && (
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
                      color: "var(--bright)", letterSpacing: "0.06em",
                      background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)",
                      padding: "0.15rem 0.5rem", borderRadius: "999px",
                    }}>ACTIVE</span>
                  )}
                </div>
                {accounts.length > 1 && (
                  <button type="button" onClick={() => removeAccount(idx)} style={{
                    background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.25)",
                    color: "var(--danger)", padding: "0.25rem 0.75rem",
                    borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem",
                    fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
                    transition: "all 0.15s",
                  }}>
                    REMOVE
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                {/* DP */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Depository Participant ID</FieldLabel>
                  <input
                    value={acct.dp}
                    onChange={e => setField(idx, "dp", e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 11000"
                    maxLength={5}
                    style={inputStyle()}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(29,111,235,0.55)"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(240,246,252,0.09)"}
                  />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "var(--dim)", marginTop: "0.3rem", display: "block" }}>
                    5-digit bank code · Nabil=11000, NIBL=17000, Everest=19000
                  </span>
                </div>

                {/* Username */}
                <div>
                  <FieldLabel>Username / BOID</FieldLabel>
                  <input
                    value={acct.meroshare_user}
                    onChange={e => setField(idx, "meroshare_user", e.target.value)}
                    placeholder="02532993"
                    style={inputStyle()}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(29,111,235,0.55)"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(240,246,252,0.09)"}
                  />
                </div>

                {/* Password */}
                <div>
                  <FieldLabel>Password</FieldLabel>
                  <input
                    type="password"
                    value={acct.meroshare_pass}
                    onChange={e => setField(idx, "meroshare_pass", e.target.value)}
                    placeholder="••••••••"
                    style={inputStyle()}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(29,111,235,0.55)"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(240,246,252,0.09)"}
                  />
                </div>

                {/* CRN */}
                <div>
                  <FieldLabel>CRN Number</FieldLabel>
                  <input
                    value={acct.crn}
                    onChange={e => setField(idx, "crn", e.target.value)}
                    placeholder="S01795432100"
                    style={inputStyle({ fontFamily: "'DM Mono', monospace" })}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(29,111,235,0.55)"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(240,246,252,0.09)"}
                  />
                </div>

                {/* PIN */}
                <div>
                  <FieldLabel>4-digit PIN</FieldLabel>
                  <input
                    type="password"
                    maxLength={4}
                    value={acct.pin}
                    onChange={e => setField(idx, "pin", e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    style={inputStyle({ letterSpacing: "0.5em", textAlign: "center" })}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(29,111,235,0.55)"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(240,246,252,0.09)"}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add account */}
          <button type="button" onClick={addAccount} style={{
            width: "100%", padding: "0.875rem",
            borderRadius: "10px", background: "rgba(29,111,235,0.04)",
            border: "1px dashed rgba(29,111,235,0.3)",
            color: "var(--muted)", cursor: "pointer",
            fontSize: "0.875rem", fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.06em", marginBottom: "1.25rem",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(29,111,235,0.09)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--blue-hi)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(29,111,235,0.5)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(29,111,235,0.04)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(29,111,235,0.3)";
            }}
          >
            + ADD ANOTHER ACCOUNT
          </button>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.25)",
              borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem",
              color: "var(--danger)", fontSize: "0.875rem",
              fontFamily: "'DM Mono', monospace",
            }}>
              ✗ {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "1rem",
            borderRadius: "10px",
            background: loading
              ? "var(--blue)"
              : "linear-gradient(135deg, var(--blue) 0%, var(--glow) 100%)",
            color: "#fff", fontWeight: 700, fontSize: "1rem",
            fontFamily: "'Outfit', sans-serif",
            border: "none", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            boxShadow: loading ? "none" : "0 0 36px rgba(29,111,235,0.35), 0 0 60px rgba(34,197,94,0.1)",
            transition: "all 0.2s",
            letterSpacing: "0.01em",
          }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 56px rgba(29,111,235,0.5), 0 0 80px rgba(34,197,94,0.18)"; }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 36px rgba(29,111,235,0.35), 0 0 60px rgba(34,197,94,0.1)"; }}
          >
            {loading
              ? (isEditing ? "Saving…" : "Activating bot…")
              : isEditing
                ? `Save ${accounts.length} Account${accounts.length > 1 ? "s" : ""} →`
                : `Activate ${accounts.length} Account${accounts.length > 1 ? "s" : ""} →`
            }
          </button>
        </form>

        {/* Security note */}
        <div style={{
          marginTop: "1.5rem", padding: "1rem 1.25rem",
          background: "rgba(240,246,252,0.02)", border: "1px solid var(--border)",
          borderRadius: "10px", display: "flex", gap: "0.875rem", alignItems: "flex-start",
        }}>
          <span style={{ color: "var(--blue-hi)", flexShrink: 0, marginTop: "0.1rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <p style={{
            fontFamily: "'DM Mono', monospace", fontSize: "0.72rem",
            color: "var(--dim)", lineHeight: 1.7, letterSpacing: "0.02em",
          }}>
            Credentials are encrypted with GitHub&apos;s Libsodium implementation and stored as Actions secrets in your private repository. AutoShare servers never see or store your passwords.
          </p>
        </div>
      </div>
    </main>
  );
}

function LogoMark() {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 9, overflow: "hidden",
      background: "#fff", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <img src="/logo.png" alt="AutoShare" width={36} height={36} style={{ objectFit: "contain", display: "block" }} />
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block",
      fontFamily: "'DM Mono', monospace", fontSize: "0.7rem",
      color: "var(--muted)", letterSpacing: "0.08em",
      marginBottom: "0.4rem", fontWeight: 500,
    }}>
      {children}
    </label>
  );
}

function inputStyle(extra?: object): React.CSSProperties {
  return {
    width: "100%", padding: "0.65rem 0.875rem",
    borderRadius: "7px",
    background: "rgba(13,17,23,0.9)",
    border: "1px solid rgba(240,246,252,0.09)",
    color: "var(--text)",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "'Outfit', sans-serif",
    transition: "border-color 0.15s",
    ...extra,
  };
}
