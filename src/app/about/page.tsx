import { generateAboutMetadata } from "@/src/lib/seo/metadata";
import AboutContent from "./AboutContent";

export async function generateMetadata() {
  return generateAboutMetadata();
}

export default function AboutPage() {
  return <AboutContent />;
}
