"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleCallback, saveToken } from "@/lib/api";
import { Suspense } from "react";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const code = params.get("code");
    const state = params.get("state");
    const savedState = sessionStorage.getItem("oauth_state");

    if (!code || !state || state !== savedState) {
      router.replace("/?error=oauth_failed");
      return;
    }

    handleCallback(code, state)
      .then((data) => {
        saveToken(data.token);
        router.replace(data.status === "active" ? "/dashboard" : "/setup");
      })
      .catch(() => router.replace("/?error=oauth_failed"));
  }, [params, router]);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(57,211,83,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(57,211,83,0.03) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(35,134,54,0.1) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <Spinner />
        <p style={{
          color: "var(--muted)", marginTop: "1.5rem",
          fontFamily: "'DM Mono', monospace", fontSize: "0.78rem",
          letterSpacing: "0.1em",
        }}>
          SETTING UP YOUR ACCOUNT…
        </p>
        <p style={{ color: "var(--dim)", marginTop: "0.4rem", fontSize: "0.8rem" }}>
          Creating your private GitHub repo
        </p>
      </div>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}

function Spinner() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: "spin 0.9s linear infinite" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(57,211,83,0.12)" strokeWidth="3" />
      <path d="M24 4 A20 20 0 0 1 44 24" fill="none" stroke="#39d353" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
