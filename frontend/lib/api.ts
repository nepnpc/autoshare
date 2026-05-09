const API = process.env.NEXT_PUBLIC_API_URL!

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("autoshare_token");
}

export function saveToken(token: string) {
  localStorage.setItem("autoshare_token", token);
}

export function clearToken() {
  localStorage.removeItem("autoshare_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function req(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = err.detail;
    throw new Error(
      Array.isArray(detail)
        ? detail.map((e: { msg?: string; loc?: unknown[] }) => `[${(e.loc ?? []).join(".")}]: ${e.msg}`).join(" · ")
        : detail || "Request failed"
    );
  }
  return res.json();
}

export async function getLoginUrl(): Promise<{ url: string; state: string }> {
  return req("/auth/login");
}

export async function handleCallback(code: string, state: string) {
  return req(`/auth/callback?code=${code}&state=${state}`);
}

export async function getMe() {
  return req("/auth/me");
}

export async function getAccounts(): Promise<{ accounts: Array<{ dp: string; meroshare_user: string; crn?: string }> }> {
  return req("/setup/accounts");
}

export async function saveCredentials(data: {
  accounts: Array<{ dp: string; meroshare_user: string; meroshare_pass: string; crn: string; pin: string }>;
}) {
  return req("/setup/credentials", { method: "POST", body: JSON.stringify(data) });
}

export async function getStatus() {
  return req("/status");
}

export async function triggerBot() {
  return req("/bot/trigger", { method: "POST" });
}

export async function deleteAccount() {
  return req("/account", { method: "DELETE" });
}
