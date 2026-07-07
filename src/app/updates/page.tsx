import { generateUpdatesMetadata } from "@/src/lib/seo/metadata";
import UpdatesContent from "./UpdatesContent";

export async function generateMetadata() {
  return generateUpdatesMetadata();
}

export default function UpdatesPage() {
  return <UpdatesContent />;
}
