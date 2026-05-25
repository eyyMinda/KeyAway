import { generateHowItWorksMetadata } from "@/src/lib/seo/metadata";
import HowItWorksContent from "./HowItWorksContent";

export async function generateMetadata() {
  return generateHowItWorksMetadata();
}

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
