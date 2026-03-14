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
export async function requireAdminSession(): Promise<AdminSession | Response> {
  const session = await auth();

  if (!session?.user?.email) {
    return Errors.unauthorized();
  }

  const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin;
  if (!isAdmin) {
    return Errors.forbidden("Admin access required");
  }

  return {
    email: session.user.email,
    isAdmin: true
  };
}
