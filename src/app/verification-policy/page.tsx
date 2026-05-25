import { generateVerificationPolicyMetadata } from "@/src/lib/seo/metadata";
import VerificationPolicyContent from "./VerificationPolicyContent";

export async function generateMetadata() {
  return generateVerificationPolicyMetadata();
}

export default function VerificationPolicyPage() {
  return <VerificationPolicyContent />;
}
