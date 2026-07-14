import type { Metadata } from "next";
import NotFoundView from "@/src/components/site/NotFoundView";

export const metadata: Metadata = {
  title: "Program Not Found — Browse All Giveaways | KeyAway",
  robots: { index: false, follow: true }
};

export default function NotFound() {
  return <NotFoundView variant="program" />;
}
