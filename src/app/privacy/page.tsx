import { generatePrivacyMetadata } from "@/src/lib/metadata";
import PrivacyContent from "./PrivacyContent";

export async function generateMetadata() {
  return generatePrivacyMetadata();
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}
