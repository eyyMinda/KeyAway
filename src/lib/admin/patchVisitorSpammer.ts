/** @fileoverview Admin PATCH helper for visitor spammer flag. */
export async function patchVisitorSpammer(visitorHash: string, isSpammer: boolean): Promise<boolean> {
  const res = await fetch("/api/v1/admin/visitor-spammer", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ visitorHash, isSpammer })
  });
  if (!res.ok) {
    console.error("PATCH visitor-spammer", await res.text());
    return false;
  }
  return true;
}
