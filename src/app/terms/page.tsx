import { generateTermsMetadata } from "@/src/lib/metadata";
import TermsContent from "./TermsContent";

export async function generateMetadata() {
  return generateTermsMetadata();
}

export default function TermsPage() {
  return <TermsContent />;
}
