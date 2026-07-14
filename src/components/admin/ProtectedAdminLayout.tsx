"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AdminLayout from "./AdminLayout";
import type { ProtectedAdminLayoutProps } from "@/src/types";

export default function ProtectedAdminLayout({
  title,
  subtitle,
  headerContent,
  children
}: ProtectedAdminLayoutProps) {
  const { data: session, status } = useSession();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin === true;
    if (!isAdmin) {
      window.location.assign("/admin/signin?callbackUrl=/admin");
      return;
    }

    setIsChecking(false);
  }, [session, status]);

  if (status === "loading" || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin === true;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title={title} subtitle={subtitle} headerContent={headerContent}>
      {children}
    </AdminLayout>
  );
}
