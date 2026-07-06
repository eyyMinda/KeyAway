import type { Metadata } from "next";
import NotFoundView from "@/src/components/site/NotFoundView";

export const metadata: Metadata = {
  robots: { index: false, follow: true }
};

export default function NotFound() {
  return <NotFoundView variant="page" />;
}
