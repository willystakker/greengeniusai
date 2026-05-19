// Simple client-side auth state — persists across refreshes via localStorage.
// Swap this out for Supabase once you have your API keys.

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

export function clearUser() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

export function isLoggedIn(): boolean {
  return getUser() !== null;
}
