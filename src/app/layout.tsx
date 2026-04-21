import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import Header from "@components/layout/Header";
import Footer from "@components/layout/Footer";
import PageViewTracker from "@components/PageViewTracker";
import { auth } from "@/auth";
import { SessionProvider } from "@components/providers/SessionProvider";
import { StoreDetailsProvider } from "@components/providers/StoreDetailsProvider";
import { LogoData, SocialData } from "@/src/types";
import { urlFor } from "../sanity/lib/image";
import { getImageDimensions } from "@sanity/asset-utils";
import { generateHomePageMetadata } from "@/src/lib/seo/metadata";
import { getRecentNotifications } from "@/src/lib/notifications/notificationUtils.server";
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

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("referer") || "";
  const isAdminOrStudio = pathname.includes("/admin") || pathname.includes("/studio");

  if (isAdminOrStudio) {
    noStore();
  }

  const [session, storeData, notifications] = await Promise.all([
    auth(),
    getCachedStoreDetailsDocument(),
    getRecentNotifications()
  ]);

  const currentLogo = storeData?.logoLight;
  const logoData: LogoData = {
    src: urlFor(currentLogo).url(),
    alt: storeData?.title,
    width: 200, // || getImageDimensions(currentLogo).width,
    height: 100, // || getImageDimensions(currentLogo).height,
    blurDataURL: urlFor(currentLogo).width(24).height(24).blur(10).url()
  };

  const socialData: SocialData = {
    socialLinks: storeData?.socialLinks ?? []
  };

  return (
    <html lang="en">
      <head>
        {/* Verification Metadata */}
        <meta name="google-site-verification" content="jCM2s4y7bLvOzH32pe8QtRIdwbgEOmntka957Z-tXKI" />
        <meta name="facebook-domain-verification" content="r1iisd1vo2n1fuctve43oc853x7k3p" />

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

        {/* Facebook App ID Metadata */}
        {process.env.NEXT_PUBLIC_FB_APP_ID && <meta property="fb:app_id" content={process.env.NEXT_PUBLIC_FB_APP_ID} />}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider session={session}>
          <StoreDetailsProvider value={storeData}>
            <PageViewTracker />
            <div className="mainContent flex flex-col min-h-screen">
              <Header logoData={logoData} notifications={notifications} socialData={socialData} />
              {children}
              <Footer logoData={logoData} socialData={socialData} />
            </div>
          </StoreDetailsProvider>
          <Analytics />
          <SpeedInsights />
        </SessionProvider>
      </body>
    </html>
  );
}
