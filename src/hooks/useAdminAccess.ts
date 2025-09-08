"use client";

import { useState, useEffect } from "react";

interface AdminAccessResult {
  isAdmin: boolean;
  loading: boolean;
}

export function useAdminAccess(): AdminAccessResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // First check if admin verification key exists in localStorage
        const storedValue = typeof window !== "undefined" ? localStorage.getItem("keyaway_admin_verified") : null;
        const hasLocalStorageKey = storedValue !== null;

        if (!hasLocalStorageKey) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // If localStorage has key, check with server
        const response = await fetch("/api/admin/check-access");
        const data = await response.json();

        // Only set as admin if BOTH localStorage has key AND server confirms admin access
        if (data.isAdmin) {
          setIsAdmin(true);
        } else {
          // Clear localStorage if server says not admin
          localStorage.removeItem("keyaway_admin_verified");
          setIsAdmin(false);
        }
      } catch {
        // Clear localStorage on error too
        localStorage.removeItem("keyaway_admin_verified");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();

    // Listen for localStorage changes to refresh when admin logs in/out
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "keyaway_admin_verified") {
        checkAdminAccess();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
      }
    };
  }, []);

  return { isAdmin, loading };
}
