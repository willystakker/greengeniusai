// Client-side auth state.
// localStorage stores display info only (name, email, plan UI).
// Real auth is enforced server-side via the HTTP-only ggai_session cookie
// set by /api/auth — middleware protects /dashboard using that cookie.

export interface User {
  id: string;
  name: string;
  email: string;
  riskProfile: "conservative" | "moderate" | "aggressive";
  botActive: boolean;
  subscriptionStatus: "trialing" | "active" | "cancelled";
  trialEnds?: string;
}

const KEY         = "ggai_user";
const SESSION_AT  = "ggai_session_at";
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function saveUser(user: User) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_AT, Date.now().toString());
  }
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

/** Returns true if a session exists and is still within its 24-hour client TTL. */
export function isSessionValid(): boolean {
  const user = getUser();
  if (!user) return false;
  const storedAt = localStorage.getItem(SESSION_AT);
  if (!storedAt) return true; // legacy — allow
  return Date.now() - parseInt(storedAt, 10) < SESSION_TTL;
}

/** Signs out: clears localStorage AND revokes the HTTP-only session cookie. */
export async function clearUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SESSION_AT);
  }
  try {
    await fetch("/api/auth", { method: "DELETE" });
  } catch {
    // Best-effort — cookie will expire naturally
  }
}

export function isLoggedIn(): boolean {
  return getUser() !== null;
}
