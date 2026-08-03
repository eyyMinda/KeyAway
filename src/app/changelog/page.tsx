import { generateChangelogMetadata } from "@/src/lib/seo/metadata";
import ChangelogContent from "./ChangelogContent";

export async function generateMetadata() {
  return generateChangelogMetadata();
}

interface ChangelogPageProps {
  searchParams: Promise<{ month?: string; limit?: string }>;
}

export default function ChangelogPage({ searchParams }: ChangelogPageProps) {
  return <ChangelogContent searchParams={searchParams} />;
}
