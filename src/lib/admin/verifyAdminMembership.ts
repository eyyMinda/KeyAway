/**
 * Verify if a user's email is in the Sanity project (admin access).
 * Uses Sanity Access API when token has scope, otherwise falls back to allowlist.
 */

const SANITY_ACCESS_API = "https://api.sanity.io/v2025-07-11/access";

export async function verifyAdminMembership(email: string | null | undefined): Promise<boolean> {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;

  // Development bypass when no membership config is set
  const allowlist = process.env.ADMIN_ALLOWED_EMAILS;
  const token = process.env.SANITY_ACCESS_TOKEN ?? process.env.SANITY_API_TOKEN;
  if (process.env.NODE_ENV === "development" && !allowlist && !token) {
    return true;
  }

  // Fallback: check allowlist from env
  if (allowlist) {
    const allowed = allowlist
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.includes(normalizedEmail)) {
      return true;
    }
  }

  // Try Sanity Access API (requires token with sanity.project.members.read)
  const projectId = process.env.NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID;

  if (!token || !projectId) {
    return false;
  }

  try {
    let nextCursor: string | null = "";
    const seenEmails = new Set<string>();

    do {
      const url = new URL(`${SANITY_ACCESS_API}/project/${projectId}/users`);
      if (nextCursor) url.searchParams.set("nextCursor", nextCursor);
      url.searchParams.set("limit", "100");

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        cache: "no-store"
      });

      if (res.status === 401 || res.status === 403) {
        return false;
      }

      if (!res.ok) {
        break;
      }

      const body = (await res.json()) as {
        data?: Array<{ profile?: { email?: string } }>;
        nextCursor?: string | null;
      };

      const users = body.data ?? [];
      for (const u of users) {
        const em = u.profile?.email?.trim().toLowerCase();
        if (em) seenEmails.add(em);
      }

      nextCursor = body.nextCursor ?? null;
    } while (nextCursor);

    return seenEmails.has(normalizedEmail);
  } catch {
    return false;
  }
}
