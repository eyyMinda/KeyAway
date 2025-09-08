import { client } from "@/src/sanity/lib/client";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

/**
 * Check if the current user has admin access by verifying they can access Sanity Studio
 * This is done by checking if they can perform a query that requires authentication
 */
export async function checkAdminAccess(): Promise<{ isAdmin: boolean; user?: AdminUser }> {
  try {
    // Try to access a resource that requires authentication
    // This will fail if the user is not authenticated
    const result = await client.fetch(`*[_type == "sanity.user"][0]{
      id,
      name,
      email,
      image
    }`);

    // If we get here without error, user is authenticated
    if (result) {
      return { isAdmin: true, user: result };
    }

    // If no user data but no error, user might be authenticated but no user record
    // Try another authenticated query to confirm
    await client.fetch(`*[_type == "sanity.user"]{_id}[0]`);
    return { isAdmin: true };
  } catch (error) {
    // Any error means user is not authenticated
    console.log("Admin access check failed - user not authenticated:", error);
    return { isAdmin: false };
  }
}

/**
 * Server-side function to check admin access
 * Use this in API routes or server components
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
 * Use this in client components
 */
export async function checkAdminAccessClient(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/check-access");
    const data = await response.json();
    return data.isAdmin;
  } catch (error) {
    console.error("Failed to check admin access:", error);
    return false;
  }
}

/**
 * Check if user is authenticated by checking browser storage
 * This is a fallback method for client-side checks
 */
export function isAuthenticatedInBrowser(): boolean {
  if (typeof window === "undefined") return false;

  // Check for Sanity Studio authentication token in localStorage
  // The key format is __studio_auth_token_{projectId}
  const projectId = process.env.NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID;
  const authKey = `__studio_auth_token_${projectId}`;
  let sanityToken = localStorage.getItem(authKey);

  // If no token found with project ID, try to find any Sanity auth token
  if (!sanityToken) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("__studio_auth_token_")) {
        sanityToken = localStorage.getItem(key);
        break;
      }
    }
  }

  if (sanityToken) {
    try {
      const tokenData = JSON.parse(sanityToken);

      // Check if token exists and is not expired
      if (tokenData.token && tokenData.time) {
        const tokenTime = new Date(tokenData.time);
        const now = new Date();
        const timeDiff = now.getTime() - tokenTime.getTime();
        const isNotExpired = timeDiff < 24 * 60 * 60 * 1000;
        const hoursLeft = (24 * 60 * 60 * 1000 - timeDiff) / (1000 * 60 * 60);

        if (isNotExpired) {
          console.log(`✅ Admin authenticated - ${hoursLeft.toFixed(1)} hours remaining`);
        } else {
          console.log("❌ Admin authentication expired");
        }

        return isNotExpired;
      } else {
        console.log("❌ Admin authentication token invalid");
      }
    } catch (error) {
      console.log("❌ Admin authentication token corrupted");
    }
  } else {
    console.log("❌ Admin not authenticated - no Sanity Studio session");
  }

  return false;
}
