import { generatePrivacyMetadata } from "@/src/lib/seo/metadata";
import PrivacyContent from "./PrivacyContent";

export async function generateMetadata() {
  return generatePrivacyMetadata();
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}
