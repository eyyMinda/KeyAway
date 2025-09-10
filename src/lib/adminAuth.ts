import { client } from "@/src/sanity/lib/client";
import { storeDetailsQuery } from "./queries";
import { AdminUser } from "@/src/types";

/**
 * Check if the current user has admin access by verifying they can access Sanity Studio
 */
export async function checkAdminAccess(): Promise<{ isAdmin: boolean; user?: AdminUser }> {
  // In development mode (localhost), always allow admin access
  if (process.env.NODE_ENV === "development") {
    return { isAdmin: true };
  }

  try {
    // Try to access Sanity - if this succeeds, user is admin
    await client.fetch(storeDetailsQuery);
    return { isAdmin: true };
  } catch {
    // If we can't access Sanity, user is not admin
    return { isAdmin: false };
  }
}

/**
 * Server-side function to check admin access
 */
export async function requireAdminAccess() {
  const { isAdmin } = await checkAdminAccess();

  if (!isAdmin) {
    throw new Error("Admin access required");
  }

  return true;
}

/**
 * Client-side function to check admin access
 */
export async function checkAdminAccessClient(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/check-access");
    const data = await response.json();
    return data.isAdmin;
  } catch {
    return false;
  }
}

/**
 * Clear admin verification session
 */
export function clearAdminVerification(refresh = false): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("keyaway_admin_verified");
    // Force a page refresh to clear all admin state
    if (refresh) window.location.reload();
  }
}

/**
 * Check if user is authenticated by checking browser storage
 */
export function isAuthenticatedInBrowser(): boolean {
  if (typeof window === "undefined") return false;

  // Check for verified admin session first
  const verifiedSession = localStorage.getItem("keyaway_admin_verified");
  if (verifiedSession) {
    try {
      const sessionData = JSON.parse(verifiedSession);
      const now = new Date();
      const sessionTime = new Date(sessionData.verifiedAt);
      const timeDiff = now.getTime() - sessionTime.getTime();
      const isSessionValid = timeDiff < 2 * 60 * 60 * 1000; // 2 hours

      if (isSessionValid) {
        return true;
      } else {
        localStorage.removeItem("keyaway_admin_verified");
      }
    } catch {
      localStorage.removeItem("keyaway_admin_verified");
    }
  }

  return false;
}
