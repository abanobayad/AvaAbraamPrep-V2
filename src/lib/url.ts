/** Returns a normalized http(s) URL, or null for anything else (javascript:, data:, garbage). */
export function safeHttpUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const u = new URL(input.trim());
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {}
  return null;
}
