import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { client } from "@/src/sanity/lib/client";
import { storeDetailsQuery, socialLinksQuery } from "@lib/queries";
import Header from "@components/layout/Header";
import Footer from "@components/layout/Footer";
import PageViewTracker from "@components/PageViewTracker";
import { LogoData, SocialData } from "@/src/types";
import { urlFor } from "../sanity/lib/image";
import { getImageDimensions } from "@sanity/asset-utils";
import { generateHomePageMetadata } from "@/src/lib/metadata";
import { getRecentNotifications } from "@/src/lib/notificationUtils.server";
import { headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const revalidate = 60;

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
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("referer") || "";
  const isAdminOrStudio = pathname.includes("/admin") || pathname.includes("/studio");

  // Bypass cache for admin/studio routes to ensure fresh notifications
  if (isAdminOrStudio) {
    noStore();
  }

  const [storeData, socialLinks, notifications] = await Promise.all([
    getStoreData(),
    client.fetch(socialLinksQuery),
    getRecentNotifications()
  ]);

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
      <head>
        <meta name="google-site-verification" content="jCM2s4y7bLvOzH32pe8QtRIdwbgEOmntka957Z-tXKI" />

        {/* Technology Stack Metadata */}
        <meta name="generator" content="Next.js" />
        <meta name="powered-by" content="Next.js" />
        <meta name="cms" content="Sanity.io" />
        <meta name="hosting" content="Vercel" />
        <meta name="framework" content="Next.js" />
        <meta name="platform" content="Vercel" />

        {/* Additional Technology Information */}
        <meta name="build-tool" content="Next.js" />
        <meta name="deployment-platform" content="Vercel" />
        <meta name="content-management" content="Sanity.io" />
        <meta name="database" content="Sanity.io" />
        <meta name="cdn" content="Vercel Edge Network" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PageViewTracker />
        <div className="mainContent flex flex-col min-h-screen">
          <Header storeData={storeData} logoData={logoData} notifications={notifications} socialData={socialData} />
          {children}
          <Footer storeData={storeData} logoData={logoData} socialData={socialData} />
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
