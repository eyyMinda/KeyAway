import type { Metadata } from "next";
import NotFoundView from "@/src/components/site/NotFoundView";

export const metadata: Metadata = {
  title: "Program not found | KeyAway",
  robots: { index: false, follow: true }
};

export default function NotFound() {
  return <NotFoundView variant="program" />;
}
