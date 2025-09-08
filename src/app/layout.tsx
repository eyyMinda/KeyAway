import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { client } from "@/src/sanity/lib/client";
import { storeDetailsQuery, socialLinksQuery } from "@lib/queries";
import Header from "@components/layout/Header";
import Footer from "@components/layout/Footer";
import { LogoData, SocialData } from "@/src/types/global";
import { urlFor } from "../sanity/lib/image";
import { getImageDimensions } from "@sanity/asset-utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export async function generateMetadata(): Promise<Metadata> {
  const storeData = await getStoreData();
  const storeTitle = storeData?.title || "KeyAway";

  return {
    title: {
      default: `${storeTitle} - Free Giveaway CD Keys`,
      template: `%s | ${storeTitle}`
    },
    description:
      "Get free CD keys for popular software. Download programs with working license keys from our giveaway collection.",
    keywords: ["free cd keys", "giveaway", "software keys", "license keys", "free software", "iobit pro", "pro cd key"],
    authors: [{ name: storeTitle }],
    creator: storeTitle,
    publisher: storeTitle,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1
      }
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://keyaway.com",
      siteName: storeTitle,
      title: `${storeTitle} - Free Giveaway CD Keys`,
      description:
        "Get free CD keys for popular software. Download programs with working license keys from our giveaway collection."
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeTitle} - Free Giveaway CD Keys`,
      description:
        "Get free CD keys for popular software. Download programs with working license keys from our giveaway collection."
    },
    verification: {
      google: "your-google-verification-code" // Replace with actual verification code
    }
  };
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
