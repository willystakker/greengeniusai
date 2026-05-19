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

const KEY = "ggai_user";

export function saveUser(user: User) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

/** Signs out: clears localStorage AND revokes the HTTP-only session cookie. */
export async function clearUser() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
  try {
    await fetch("/api/auth", { method: "DELETE" });
  } catch {
    // Best-effort — cookie will expire naturally
  }
}

export function isLoggedIn(): boolean {
  return getUser() !== null;
}
