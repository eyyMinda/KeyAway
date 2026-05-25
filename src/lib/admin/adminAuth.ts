import { auth } from "@/auth";
import { Errors } from "@/src/lib/api/errors";

export type AdminSession = {
  email: string;
  isAdmin: true;
};

/**
 * Require a valid admin session for API routes.
 * Returns the session or throws/returns error response.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin;
  if (!isAdmin) return null;

  return { email: session.user.email, isAdmin: true };
}

export async function requireAdminSession(): Promise<AdminSession | Response> {
  const admin = await getAdminSession();
  if (!admin) {
    const session = await auth();
    if (!session?.user?.email) return Errors.unauthorized();
    return Errors.forbidden("Admin access required");
  }
  return admin;
}
