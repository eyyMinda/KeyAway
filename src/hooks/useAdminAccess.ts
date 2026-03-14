"use client";

import { useSession } from "next-auth/react";
import type { AdminAccessResult } from "@/src/types";

export function useAdminAccess(): AdminAccessResult {
  const { data: session, status } = useSession();

  const isAdmin = status === "authenticated" && (session?.user as { isAdmin?: boolean })?.isAdmin === true;
  const loading = status === "loading";

  return { isAdmin: !!isAdmin, loading };
}
