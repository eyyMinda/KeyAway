"use client";

import { useSyncExternalStore } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { readAdminTheme, setAdminTheme, subscribeAdminTheme } from "@/src/lib/admin/adminTheme";

export default function AdminThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeAdminTheme, readAdminTheme, () => "light" as const);
  const next = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} mode`;

  return (
    <button
      type="button"
      onClick={() => setAdminTheme(next)}
      title={label}
      aria-label={label}
      className={`p-2.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${className}`}>
      {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
    </button>
  );
}
