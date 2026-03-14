import NextAuth from "next-auth";
// import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { verifyAdminMembership } from "@/src/lib/admin/verifyAdminMembership";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    // Google({
    //   clientId: process.env.AUTH_GOOGLE_ID!,
    //   clientSecret: process.env.AUTH_GOOGLE_SECRET!
    // }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60 // 2 hours
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      return verifyAdminMembership(user.email);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.isAdmin = true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
        (session.user as { isAdmin?: boolean }).isAdmin = token.isAdmin === true;
      }
      return session;
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin")) {
        if (auth) return true;
        const signInUrl = new URL("/api/auth/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname || "/admin");
        return Response.redirect(signInUrl);
      }
      return true;
    }
  },
  pages: {
    signIn: "/api/auth/signin"
  }
});
