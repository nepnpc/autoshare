"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMe, getStatus, triggerBot, deleteAccount, clearToken, isLoggedIn } from "@/lib/api";

type Run = { ipo_name: string | null; run_at: string; status: string; error_message: string | null };
type StatusData = { status: string; last_run_at: string | null; last_run_status: string | null; runs: Run[] };
type UserData = { github_username: string; github_repo_name: string; meroshare_dp: string; status: string };

const STATUS_DOT: Record<string, string> = {
  applied: "var(--bright)",
  no_ipos: "var(--muted)",
  already_applied: "var(--orange)",
  error: "var(--danger)",
  active: "var(--bright)",
  pending: "var(--orange)",
};

const STATUS_LABEL: Record<string, string> = {
  applied: "Applied",
  no_ipos: "No open IPOs",
  already_applied: "Already applied",
  error: "Error",
  active: "Active",
  pending: "Setup pending",
};

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NP", { month: "short", day: "numeric" }) + " · " +
    d.toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" });
}

function DashboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState("");
  const [triggerOk, setTriggerOk] = useState(false);
  const [justSetup] = useState(params.get("setup") === "done");
  const [showDelete, setShowDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, s] = await Promise.all([getMe(), getStatus()]);
      setUser(u);
      setStatusData(s);
    } catch {
      clearToken();
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/"); return; }
    load();
  }, [load, router]);

  async function handleTrigger() {
    setTriggering(true);
    setTriggerMsg("");
    setTriggerOk(false);
    try {
      const res = await triggerBot();
      setTriggerMsg(res.message || "Workflow triggered successfully");
      setTriggerOk(true);
    } catch (err: unknown) {
      setTriggerMsg(err instanceof Error ? err.message : "Failed to trigger");
      setTriggerOk(false);
    }
    setTriggering(false);
  }

  async function handleDelete() {
    await deleteAccount().catch(() => {});
    clearToken();
    router.replace("/");
  }

  if (!user || !statusData) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            border: "2px solid var(--border-hi)", borderTopColor: "var(--blue)",
            animation: "spin 0.8s linear infinite",
          }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "var(--muted)", letterSpacing: "0.1em" }}>
            LOADING…
          </span>
        </div>
      </main>
    );
  }

  const isActive = user.status === "active";

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", overflow: "hidden", position: "relative" }}>

      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(240,246,252,0.04) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      {/* Glows */}
      <div style={{
        position: "fixed", top: "-15%", left: "50%", transform: "translateX(-50%)",
        width: "700px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(29,111,235,0.10) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", top: "-5%", right: "-5%",
        width: "350px", height: "350px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 70%)",
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
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: "0.75rem",
            color: "var(--muted)",
          }}>
            @{user.github_username}
          </span>
          <button onClick={() => { clearToken(); router.replace("/"); }} style={{
            background: "transparent", border: "1px solid var(--border)",
            color: "var(--muted)", padding: "0.4rem 1rem",
            borderRadius: "6px", cursor: "pointer",
            fontFamily: "'DM Mono', monospace", fontSize: "0.72rem",
            letterSpacing: "0.06em", transition: "all 0.15s",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-hi)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
            }}
          >LOGOUT</button>
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 5, padding: "2.5rem 1.5rem 4rem", maxWidth: "760px", margin: "0 auto" }}>

        {/* Setup success banner */}
        {justSetup && (
          <div className="anim-fade-up" style={{
            background: "rgba(29,111,235,0.1)", border: "1px solid var(--border-hi)",
            borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1.5rem",
            display: "flex", alignItems: "center", gap: "0.875rem",
          }}>
            <span style={{ color: "var(--bright)", flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </span>
            <div>
              <p style={{ color: "var(--bright)", fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.15rem" }}>
                Bot activated successfully!
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.82rem", fontFamily: "'DM Mono', monospace" }}>
                Runs daily at 6:15 AM NST · Next IPO will be applied automatically
              </p>
            </div>
          </div>
        )}

        {/* Status overview */}
        <div className="anim-fade-up" style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "14px", padding: "1.75rem", marginBottom: "1.25rem",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, right: 0, width: "200px", height: "200px",
            background: "radial-gradient(circle at 100% 0%, rgba(29,111,235,0.06) 0%, transparent 65%)",
            pointerEvents: "none",
          }} />

          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: "0.68rem",
            color: "var(--dim)", letterSpacing: "0.1em", marginBottom: "1.25rem",
          }}>
            BOT STATUS
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
            {/* Active status */}
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "var(--dim)", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>STATUS</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: STATUS_DOT[user.status] || "var(--muted)",
                  display: "inline-block",
                  ...(isActive ? { animation: "pulseGlowGreen 2s ease infinite" } : {}),
                }} />
                <span style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  fontSize: "1rem", color: isActive ? "var(--bright)" : "var(--muted)",
                }}>
                  {STATUS_LABEL[user.status] || user.status}
                </span>
              </div>
            </div>

            {/* Last run */}
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "var(--dim)", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>LAST RUN</p>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.875rem", color: "var(--text)" }}>
                {statusData.last_run_at ? fmt(statusData.last_run_at) : "—"}
              </span>
            </div>

            {/* Last result */}
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "var(--dim)", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>LAST RESULT</p>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: "0.875rem",
                color: STATUS_DOT[statusData.last_run_status || ""] || "var(--muted)",
                fontWeight: 500,
              }}>
                {STATUS_LABEL[statusData.last_run_status || ""] || "—"}
              </span>
            </div>

            {/* Next run */}
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "var(--dim)", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>NEXT RUN</p>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.875rem", color: "var(--orange)" }}>
                6:15 AM NST
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={handleTrigger}
              disabled={triggering || !isActive}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.625rem 1.25rem", borderRadius: "8px",
                background: triggering || !isActive
                  ? "rgba(29,111,235,0.05)"
                  : "linear-gradient(135deg, var(--blue) 0%, var(--glow) 100%)",
                border: `1px solid ${!isActive ? "var(--border)" : "transparent"}`,
                color: !isActive ? "var(--dim)" : "#fff",
                cursor: triggering || !isActive ? "not-allowed" : "pointer",
                fontSize: "0.875rem", fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                boxShadow: isActive && !triggering ? "0 0 24px rgba(29,111,235,0.3)" : "none",
                transition: "all 0.2s",
                opacity: !isActive ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (isActive && !triggering) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 36px rgba(29,111,235,0.5)"; }}
              onMouseLeave={e => { if (isActive && !triggering) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(29,111,235,0.3)"; }}
            >
              {triggering ? (
                <>
                  <span style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Triggering…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Run bot now
                </>
              )}
            </button>

            <a
              href={`https://github.com/${user.github_username}/${user.github_repo_name}/actions`}
              target="_blank" rel="noopener noreferrer"
              style={{
                padding: "0.625rem 1.25rem", borderRadius: "8px",
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--muted)", fontSize: "0.78rem",
                textDecoration: "none", fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.04em",
                transition: "all 0.15s",
              } as React.CSSProperties}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-hi)";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)";
              }}
            >
              GitHub Actions ↗
            </a>

            <a
              href="/setup"
              style={{
                padding: "0.625rem 1.25rem", borderRadius: "8px",
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--muted)", fontSize: "0.78rem",
                textDecoration: "none", fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.04em", transition: "all 0.15s",
              } as React.CSSProperties}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-hi)";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)";
              }}
            >
              Edit accounts ✎
            </a>
          </div>

          {triggerMsg && (
            <div style={{
              marginTop: "0.875rem", padding: "0.625rem 0.875rem",
              background: triggerOk ? "rgba(74,222,128,0.07)" : "rgba(248,81,73,0.07)",
              border: `1px solid ${triggerOk ? "rgba(74,222,128,0.3)" : "rgba(248,81,73,0.25)"}`,
              borderRadius: "6px",
              color: triggerOk ? "var(--bright)" : "var(--danger)",
              fontSize: "0.8rem", fontFamily: "'DM Mono', monospace",
            }}>
              {triggerOk ? "✓" : "✗"} {triggerMsg}
            </div>
          )}
        </div>

        {/* Run history */}
        <div className="anim-fade-up anim-delay-1" style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "14px", padding: "1.75rem", marginBottom: "1.25rem",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "1.25rem",
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: "0.68rem",
              color: "var(--dim)", letterSpacing: "0.1em",
            }}>
              RUN HISTORY
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: "0.68rem",
              color: "var(--dim)", letterSpacing: "0.06em",
            }}>
              {statusData.runs.length} RUNS
            </div>
          </div>

          {statusData.runs.length === 0 ? (
            <div style={{
              padding: "2rem", textAlign: "center",
              border: "1px dashed var(--border)", borderRadius: "10px",
            }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", color: "var(--dim)", letterSpacing: "0.06em" }}>
                NO RUNS YET
              </p>
              <p style={{ color: "var(--dim)", fontSize: "0.8rem", marginTop: "0.4rem" }}>
                Bot runs daily at 6:15 AM NST
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {statusData.runs.map((r, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.875rem 1rem",
                  background: "rgba(13,17,23,0.7)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px", gap: "1rem", flexWrap: "wrap",
                  transition: "border-color 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hi)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"}
                >
                  <div>
                    <p style={{ color: "var(--text)", fontSize: "0.9rem", fontWeight: 500, marginBottom: r.error_message ? "0.2rem" : 0 }}>
                      {r.ipo_name || "No open IPOs"}
                    </p>
                    {r.error_message && (
                      <p style={{ color: "var(--danger)", fontSize: "0.78rem", fontFamily: "'DM Mono', monospace" }}>
                        {r.error_message}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: STATUS_DOT[r.status] || "var(--muted)",
                        display: "inline-block",
                      }} />
                      <span style={{
                        fontFamily: "'DM Mono', monospace", fontSize: "0.78rem",
                        color: STATUS_DOT[r.status] || "var(--muted)",
                        fontWeight: 500, letterSpacing: "0.04em",
                      }}>
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: "0.72rem",
                      color: "var(--dim)",
                    }}>
                      {fmt(r.run_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="anim-fade-up anim-delay-2" style={{
          border: "1px solid rgba(248,81,73,0.15)",
          borderRadius: "14px", padding: "1.5rem",
          background: "rgba(248,81,73,0.03)",
        }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: "0.68rem",
            color: "rgba(248,81,73,0.6)", letterSpacing: "0.1em", marginBottom: "0.75rem",
          }}>
            DANGER ZONE
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem", lineHeight: 1.6 }}>
            Permanently deletes your GitHub repo, all encrypted secrets, and your AutoShare account.
          </p>

          {!showDelete ? (
            <button onClick={() => setShowDelete(true)} style={{
              padding: "0.55rem 1.25rem", borderRadius: "7px",
              background: "transparent", border: "1px solid rgba(248,81,73,0.4)",
              color: "var(--danger)", cursor: "pointer", fontSize: "0.875rem",
              fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,81,73,0.1)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
            >
              Delete account
            </button>
          ) : (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", color: "var(--danger)" }}>
                Are you sure? This cannot be undone.
              </span>
              <button onClick={handleDelete} style={{
                padding: "0.55rem 1.25rem", borderRadius: "7px",
                background: "rgba(248,81,73,0.15)", border: "1px solid var(--danger)",
                color: "var(--danger)", cursor: "pointer", fontSize: "0.875rem",
                fontFamily: "'DM Mono', monospace", fontWeight: 600,
              }}>
                Yes, delete everything
              </button>
              <button onClick={() => setShowDelete(false)} style={{
                padding: "0.55rem 1.25rem", borderRadius: "7px",
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--muted)", cursor: "pointer", fontSize: "0.875rem",
                fontFamily: "'DM Mono', monospace",
              }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lgBg3" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1565C0" />
          <stop offset="1" stopColor="#0D47A1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#lgBg3)" />
      <rect x="6" y="20" width="4" height="6" rx="1" fill="rgba(255,255,255,0.4)" />
      <rect x="11" y="15" width="4" height="11" rx="1" fill="rgba(255,255,255,0.6)" />
      <rect x="16" y="10" width="4" height="16" rx="1" fill="rgba(255,255,255,0.85)" />
      <path d="M22 12 L26 8 M26 8 H22 M26 8 V12" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}
