import type { IconType } from "react-icons";
import { FaDownload, FaKey, FaShieldAlt } from "react-icons/fa";

/** Shown below the fold in Features (option B); was previously in the hero. */
export type HomeAtAGlanceColor = "blue" | "green" | "orange";

export const homeAtAGlanceBullets: {
  icon: IconType;
  title: string;
  description: string;
  color: HomeAtAGlanceColor;
}[] = [
  { icon: FaKey, title: "Copy & Activate", description: "One-click key workflow", color: "blue" },
  { icon: FaShieldAlt, title: "Community Verified", description: "Reports keep keys fresh", color: "green" },
  { icon: FaDownload, title: "Pro Software Catalog", description: "Browse by popularity", color: "orange" }
];

export const homeAtAGlanceIconShell: Record<HomeAtAGlanceColor, string> = {
  blue: "border-[#4a90c4] bg-[#1a3a5c] text-[#66c0f4]",
  green: "border-[#3d6e1c] bg-[#1a3a2a] text-[#5ba32b]",
  orange: "border-[#a3421b] bg-[#3a2800] text-[#e8632a]"
};
