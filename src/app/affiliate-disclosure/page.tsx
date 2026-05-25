import { generateAffiliateDisclosureMetadata } from "@/src/lib/seo/metadata";
import AffiliateDisclosureContent from "./AffiliateDisclosureContent";

export async function generateMetadata() {
  return generateAffiliateDisclosureMetadata();
}

export default function AffiliateDisclosurePage() {
  return <AffiliateDisclosureContent />;
}
