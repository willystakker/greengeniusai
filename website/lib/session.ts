import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const SESSION_SECRET = process.env.SESSION_SECRET || "ggai-dev-secret-change-in-production";
const COOKIE_NAME = "ggai_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  id: string;
  email: string;
  name: string;
  plan: string;
  iat: number;
}

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export function createSessionToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(data);
  return `${data}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const data = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = sign(data);
    // Constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextResponse, payload: SessionPayload): void {
  const token = createSessionToken(payload);
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,       // JS cannot read this — blocks XSS token theft
    secure: true,         // HTTPS only
    sameSite: "lax",      // CSRF protection
    maxAge: MAX_AGE,
    path: "/",
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}

export { COOKIE_NAME };
