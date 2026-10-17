import type { ReactNode } from "react";
import { unstable_noStore as noStore } from "next/cache";
import AdminThemeScope from "@/src/components/admin/AdminThemeScope";
import { adminThemeInitScript } from "@/src/lib/admin/adminTheme";

/** Admin UI is always dynamic (auth + live data). Isolated from public ISR shell. */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  noStore();
  return (
    <>
      {/* Apply the saved light/dark choice before first paint. */}
      <script dangerouslySetInnerHTML={{ __html: adminThemeInitScript }} />
      <AdminThemeScope />
      {children}
    </>
  );
}
