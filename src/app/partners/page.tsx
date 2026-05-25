import { generatePartnersMetadata } from "@/src/lib/seo/metadata";
import PartnersContent from "./PartnersContent";

export async function generateMetadata() {
  return generatePartnersMetadata();
}

export default function PartnersPage() {
  return <PartnersContent />;
}
