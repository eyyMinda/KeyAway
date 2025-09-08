import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { client } from "@/src/sanity/lib/client";
import { storeDetailsQuery, socialLinksQuery } from "@lib/queries";
import Header from "@components/layout/Header";
import Footer from "@components/layout/Footer";
import PageViewTracker from "@components/PageViewTracker";
import { LogoData, SocialData } from "@/src/types/global";
import { urlFor } from "../sanity/lib/image";
import { getImageDimensions } from "@sanity/asset-utils";
import { generateHomePageMetadata } from "@/src/lib/metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export async function generateMetadata(): Promise<Metadata> {
  return generateHomePageMetadata();
}

async function getStoreData() {
  return (
    (await client.fetch(storeDetailsQuery))[0] || {
      title: "KeyAway",
      description: "Free Giveaway CD Keys",
      header: { isLogo: false, headerLinks: [] },
      footer: { isLogo: false, footerLinks: [] }
    }
  );
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storeData = await getStoreData();
  const socialLinks = await client.fetch(socialLinksQuery);

  const currentLogo = storeData?.logoLight;
  const logoData: LogoData = {
    src: urlFor(currentLogo).url(),
    alt: storeData?.title,
    width: getImageDimensions(currentLogo).width,
    height: getImageDimensions(currentLogo).height,
    blurDataURL: urlFor(currentLogo).width(24).height(24).blur(10).url()
  };

  const socialData: SocialData = {
    socialLinks: socialLinks || []
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PageViewTracker />
        <div className="mainContent flex flex-col min-h-screen">
          <Header storeData={storeData} logoData={logoData} />
          {children}
          <Footer storeData={storeData} logoData={logoData} socialData={socialData} />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
