"use client";

import { getSession } from "next-auth/react";

/** Client-side: whether the current NextAuth session is an authenticated admin. */
export async function isAdminSession(): Promise<boolean> {
  try {
    const session = await getSession();
    return (session?.user as { isAdmin?: boolean })?.isAdmin === true;
  } catch {
    return false;
  }
}
