import { generateUpdatesMetadata } from "@/src/lib/seo/metadata";
import UpdatesContent from "./UpdatesContent";

export async function generateMetadata() {
  return generateUpdatesMetadata();
}

interface UpdatesPageProps {
  searchParams: Promise<{ days?: string }>;
}

export default function UpdatesPage({ searchParams }: UpdatesPageProps) {
  return <UpdatesContent searchParams={searchParams} />;
}
