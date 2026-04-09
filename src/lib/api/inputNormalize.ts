export function normalizePath(path: string): string {
  const p = path.trim();
  if (!p) return "/";
  if (!p.startsWith("/")) return `/${p}`;
  return p;
}

export function sanitizeTrackingToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_\-/]/g, "_").replace(/_+/g, "_");
}
