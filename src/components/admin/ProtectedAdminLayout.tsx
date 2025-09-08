"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "./AdminLayout";
import { isAuthenticatedInBrowser } from "@/src/lib/adminAuth";

interface ProtectedAdminLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function ProtectedAdminLayout({ title, subtitle, children }: ProtectedAdminLayoutProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check browser authentication state
        const browserAuth = isAuthenticatedInBrowser();

        if (!browserAuth) {
          console.log("No browser authentication found, redirecting to homepage");
          router.push("/");
          return;
        }

        // Then check server-side authentication
        const response = await fetch("/api/admin/check-access");
        const data = await response.json();

        if (data.isAdmin) {
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          console.log("Server authentication failed, redirecting to homepage");
          router.push("/");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();

    // Set up periodic authentication check
    const interval = setInterval(() => {
      if (!isAuthenticatedInBrowser()) {
        console.log("Authentication lost, redirecting to homepage");
        router.push("/");
      }
    }, 10000); // Check every 10 seconds for better responsiveness

    return () => clearInterval(interval);
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title={title} subtitle={subtitle} user={user}>
      {children}
    </AdminLayout>
  );
}
