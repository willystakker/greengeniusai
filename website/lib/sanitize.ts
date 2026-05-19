/** Strip HTML tags and dangerous characters from user input. */
export function sanitizeString(value: unknown, maxLength = 255): string {
  if (typeof value !== "string") return "";
  return value
    .slice(0, maxLength)
    .replace(/[<>"'`]/g, "")   // strip HTML injection chars
    .trim();
}

export function sanitizeEmail(value: unknown): string {
  const raw = sanitizeString(value, 320);
  // Basic RFC-compliant email shape check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw.toLowerCase() : "";
}

export function sanitizePassword(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.slice(0, 128); // don't strip chars — passwords can have anything
}
