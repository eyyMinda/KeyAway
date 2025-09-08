/**
 * Studio verification script
 * This should be called when the Studio page loads to verify admin access
 */

import { verifyAdminAccess } from "./adminAuth";

let verificationAttempted = false;

/**
 * Verify admin access when Studio loads
 * This ensures only users with actual project access can use admin features
 */
export async function verifyStudioAccess(): Promise<void> {
  if (verificationAttempted) return;
  verificationAttempted = true;

  try {
    // Wait a bit for Sanity to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if user is authenticated with Sanity
    const projectId = process.env.NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID;
    const authKey = `__studio_auth_token_${projectId}`;
    const sanityToken = localStorage.getItem(authKey);

    if (!sanityToken) {
      console.log("ℹ️ No Sanity token found - admin verification skipped");
      return;
    }

    // Verify admin access
    const hasAccess = await verifyAdminAccess();

    if (hasAccess) {
      console.log("✅ Studio access verified - admin features enabled");
    } else {
      console.log("⚠️ Studio access limited - admin features disabled");
    }
  } catch (error) {
    console.log("❌ Studio verification failed:", error);
  }
}

/**
 * Auto-verify when Studio loads
 */
if (typeof window !== "undefined") {
  // Run verification when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", verifyStudioAccess);
  } else {
    verifyStudioAccess();
  }
}
