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
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email ?? null,
          image: profile.avatar_url,
          username: profile.login
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60 // 7 days
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      return verifyAdminMembership(user.email);
    },
    async jwt({ token, user, profile }) {
      if (user?.email) {
        token.email = user.email;
        token.isAdmin = true;
      }
      const username = (user as { username?: string })?.username ?? (profile && "login" in profile ? (profile.login as string) : undefined);
      if (username) token.username = username;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
        (session.user as { isAdmin?: boolean }).isAdmin = token.isAdmin === true;
        (session.user as { username?: string }).username = token.username as string | undefined;
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
  }
});
