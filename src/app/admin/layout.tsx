import type { ReactNode } from "react";
import { unstable_noStore as noStore } from "next/cache";

/** Admin UI is always dynamic (auth + live data). Isolated from public ISR shell. */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  noStore();
  return children;
}
