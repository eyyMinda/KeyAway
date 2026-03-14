import "next-auth";

declare module "next-auth" {
  interface User {
    isAdmin?: boolean;
    /** OAuth username (e.g. GitHub login) */
    username?: string | null;
  }

  interface Session {
    user: User & {
      email?: string | null;
      isAdmin?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean;
    email?: string | null;
    username?: string | null;
  }
}
