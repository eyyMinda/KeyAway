import { generateDmcaMetadata } from "@/src/lib/seo/metadata";
import DmcaContent from "./DmcaContent";

export async function generateMetadata() {
  return generateDmcaMetadata();
}

export default function DmcaPage() {
  return <DmcaContent />;
}
