/**
 * URL safety primitives shared by client and server.
 * Only http/https URLs are considered safe (blocks javascript:, data:, etc.).
 */

export function isSafeUrl(u: string): boolean {
  try {
    const p = new URL(u);
    return p.protocol === "http:" || p.protocol === "https:";
  } catch {
    return false;
  }
}

/** Returns the URL if it is safe to use as an href, otherwise undefined. */
export function safeHref(u: string): string | undefined {
  return isSafeUrl(u) ? u : undefined;
}
