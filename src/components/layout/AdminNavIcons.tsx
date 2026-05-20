"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useAdminAccess } from "@/src/hooks/useAdminAccess";
import { HiCog, HiChartBar, HiLogout } from "react-icons/hi";

interface AdminNavIconsProps {
  mobileLayout?: boolean;
}

export default function AdminNavIcons({ mobileLayout = false }: AdminNavIconsProps) {
  const { isAdmin, loading } = useAdminAccess();

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-3 ${mobileLayout ? "w-full border-t border-[#2a475e] pt-4" : ""}`}>
      {/* Studio Icon */}
      <Link
        href="/studio"
        title="Sanity Studio"
        className="group cursor-pointer rounded-sm bg-[#1b2838] p-2 text-[#8f98a0] transition-colors duration-200 hover:bg-[#213246] hover:text-white">
        <HiCog size={20} />
        <span className="sr-only">Sanity Studio</span>
      </Link>

      {/* Dashboard Icon */}
      <Link
        href="/admin"
        title="Admin Dashboard"
        className="group cursor-pointer rounded-sm bg-[#1b2838] p-2 text-[#8f98a0] transition-colors duration-200 hover:bg-[#213246] hover:text-white">
        <HiChartBar size={20} />
        <span className="sr-only">Admin Dashboard</span>
      </Link>

      {/* Sign out */}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        title="Sign out"
        className="cursor-pointer rounded-sm bg-[#1b2838] p-2 text-[#8f98a0] transition-colors duration-200 hover:bg-[#213246] hover:text-[#c94f4f]">
        <HiLogout size={20} />
        <span className="sr-only">Sign out</span>
      </button>
    </div>
  );
}
