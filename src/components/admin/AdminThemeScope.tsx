"use client";

import { useEffect } from "react";
import { applyAdminTheme, readAdminTheme, subscribeAdminTheme } from "@/src/lib/admin/adminTheme";

/** Keeps the admin theme class on <html> while an admin route is mounted; clears it when leaving admin. */
export default function AdminThemeScope() {
  useEffect(() => {
    const sync = () => applyAdminTheme(readAdminTheme());
    sync();
    const unsubscribe = subscribeAdminTheme(sync);
    return () => {
      unsubscribe();
      applyAdminTheme(null);
    };
  }, []);

  return null;
}
