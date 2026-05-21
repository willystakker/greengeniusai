// ── Input sanitization helpers ────────────────────────────────────────────────

/** Sanitize a ticker symbol: uppercase alphanumeric + dash + dot, max 15 chars. */
export function sanitizeSym(raw: string): string {
  return raw.replace(/[^A-Z0-9\-\.]/gi, '').slice(0, 15).toUpperCase();
}

/** Sanitize a comma-separated list of ticker symbols. */
export function sanitizeSymList(raw: string, max = 40): string[] {
  return raw
    .split(',')
    .map(s => sanitizeSym(s.trim()))
    .filter(Boolean)
    .slice(0, max);
}

/** Normalize an email address (trim, lowercase, max 254 chars). */
export function sanitizeEmail(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 254);
}

/** Validate email format (RFC-simplified). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/** Require at least 8 characters and at least one digit. */
export function isStrongPassword(pw: string): boolean {
  return pw.length >= 8 && /\d/.test(pw);
}

// ── Security event logging ────────────────────────────────────────────────────
// Replace with a real logging service (Datadog, Sentry, etc.) in production.

export function logSecurityEvent(event: string, ip: string, detail?: string): void {
  console.warn(
    `[SECURITY] ${new Date().toISOString()} | ${event} | IP: ${ip} | ${detail ?? ''}`
  );
}
