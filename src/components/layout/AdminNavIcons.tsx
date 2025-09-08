"use client";

import Link from "next/link";
import { useAdminAccess } from "@/src/hooks/useAdminAccess";
import { HiCog, HiChartBar } from "react-icons/hi";

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
        className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-200 group">
        <HiCog size={20} />
        <span className="sr-only">Sanity Studio</span>
      </Link>

      {/* Dashboard Icon */}
      <Link
        href="/admin"
        title="Admin Dashboard"
        className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-200 group">
        <HiChartBar size={20} />
        <span className="sr-only">Admin Dashboard</span>
      </Link>
    </div>
  );
}
