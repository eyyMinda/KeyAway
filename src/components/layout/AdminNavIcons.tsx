"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useAdminAccess } from "@/src/hooks/useAdminAccess";
import { HiCog, HiChartBar, HiLogout } from "react-icons/hi";

export default function AdminNavIcons() {
  const { isAdmin, loading } = useAdminAccess();

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Studio Icon */}
      <Link
        href="/studio"
        title="Sanity Studio"
        className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-200 group cursor-pointer">
        <HiCog size={20} />
        <span className="sr-only">Sanity Studio</span>
      </Link>

      {/* Dashboard Icon */}
      <Link
        href="/admin"
        title="Admin Dashboard"
        className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-200 group cursor-pointer">
        <HiChartBar size={20} />
        <span className="sr-only">Admin Dashboard</span>
      </Link>

      {/* Sign out */}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        title="Sign out"
        className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-red-400 transition-all duration-200 cursor-pointer">
        <HiLogout size={20} />
        <span className="sr-only">Sign out</span>
      </button>
    </div>
  );
}
