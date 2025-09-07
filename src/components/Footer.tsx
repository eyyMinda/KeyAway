import { StoreDetails, SanityLink, LogoData } from "@/src/types/global";
import Link from "next/link";
import { IdealImageClient } from "./IdealImageClient";

interface FooterProps {
  storeData: StoreDetails;
  logoData: LogoData;
}

export default function Footer({ storeData, logoData }: FooterProps) {
  const footer = storeData.footer;
  let isLogo = false;
  let footerLinks: SanityLink[] = [];
  if (footer && (footer.footerLinks || footer.isLogo)) {
    isLogo = footer.isLogo;
    footerLinks = footer.footerLinks;
  }

  return (
    <footer className="bg-gray-100 mt-auto py-6 text-center text-sm text-gray-600">
      {isLogo ? storeData.title : <IdealImageClient {...logoData} className="max-w-8" />}
      {footerLinks &&
        footerLinks.map((link, i) =>
          link.external ? (
            <a key={i} href={link.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline ml-1">
              {link.title}
            </a>
          ) : (
            <Link key={i} href={`/program/${link.slug?.current}`} className="text-blue-600 hover:underline ml-1">
              {link.title}
            </Link>
          )
        )}

      <p>
        <a href="https://github.com/eyyMinda" className="text-blue-600 hover:underline ml-1">
          GitHub
        </a>
      </p>
      <a
        href="https://www.buymeacoffee.com/eyyMinda"
        target="_blank"
        className="mt-2 inline-block bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500">
        🥕 Buy Me Carrot Juice
      </a>
    </footer>
  );
}
