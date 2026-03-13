import { generateTermsMetadata } from "@/src/lib/seo/metadata";
import TermsContent from "./TermsContent";

export async function generateMetadata() {
  return generateTermsMetadata();
}

export default function TermsPage() {
  return <TermsContent />;
}
