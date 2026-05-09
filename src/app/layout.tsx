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

/** Keep in sync with `PUBLIC_ISR_REVALIDATE_SECONDS`. */
export const revalidate = 120;

type HeadMetaTag = {
  name?: string;
  property?: string;
  content: string;
  condition?: boolean;
};

const HEAD_METADATA_GROUPS: Record<string, HeadMetaTag[]> = {
  verification: [
    { name: "google-site-verification", content: "jCM2s4y7bLvOzH32pe8QtRIdwbgEOmntka957Z-tXKI" },
    { name: "facebook-domain-verification", content: "r1iisd1vo2n1fuctve43oc853x7k3p" },
    { name: "yandex-verification", content: "28d6f2a8e0d52c05" }
  ],
  technologyStack: [
    { name: "generator", content: "Next.js" },
    { name: "powered-by", content: "Next.js" },
    { name: "cms", content: "Sanity.io" },
    { name: "hosting", content: "Vercel" },
    { name: "framework", content: "Next.js" },
    { name: "platform", content: "Vercel" }
  ],
  additionalTechnology: [
    { name: "build-tool", content: "Next.js" },
    { name: "deployment-platform", content: "Vercel" },
    { name: "content-management", content: "Sanity.io" },
    { name: "database", content: "Sanity.io" },
    { name: "cdn", content: "Vercel Edge Network" }
  ],
  social: [
    {
      property: "fb:app_id",
      content: process.env.NEXT_PUBLIC_FB_APP_ID ?? "",
      condition: !!process.env.NEXT_PUBLIC_FB_APP_ID
    }
  ]
};

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
  const needsSession = isAdminOrStudio;

  if (isAdminOrStudio) {
    noStore();
  }

  const [session, storeData] = await Promise.all([
    needsSession ? auth() : Promise.resolve(null),
    getCachedStoreDetailsDocument()
  ]);

  const currentLogo = storeData?.logoLight;
  /** Match header/footer slot (~104×48 CSS px); keeps `/_next/image` width near 128–256 instead of 384+. */
  const LOGO_WIDTH_HINT = 256;
  const logoDims = currentLogo ? getImageDimensions(currentLogo) : { width: 200, height: 100 };
  const logoData: LogoData = {
    src: urlFor(currentLogo).width(LOGO_WIDTH_HINT).quality(70).auto("format").url(),
    alt: `${storeData?.title ?? "KeyAway"} logo`,
    width: logoDims.width,
    height: logoDims.height,
    blurDataURL: urlFor(currentLogo).width(24).height(24).blur(10).url(),
    widthHint: LOGO_WIDTH_HINT,
    sizes: "(max-width: 419px) 30vw, 130px",
    quality: 70
  };

  const socialData: SocialData = {
    socialLinks: storeData?.socialLinks ?? []
  };
  const renderedHeadMetaTags = Object.entries(HEAD_METADATA_GROUPS).flatMap(([groupName, tags]) =>
    tags
      .filter(tag => tag.condition !== false)
      .map((tag, index) => (
        <meta
          key={`${groupName}-${tag.name ?? tag.property}-${index}`}
          {...(tag.name ? { name: tag.name } : { property: tag.property })}
          content={tag.content}
        />
      ))
  );

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>{renderedHeadMetaTags}</head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f1923] text-[#c6d4df]`}>
        <SessionProvider session={session}>
          <PageViewTracker />
          <StoreDetailsProvider value={storeData}>
            <div className="mainContent flex min-h-screen flex-col bg-[#0f1923] text-[#c6d4df]">
              <Header logoData={logoData} socialData={socialData} />
              <main className="w-full">{children}</main>
              <Footer logoData={logoData} socialData={socialData} />
            </div>
          </StoreDetailsProvider>
        </SessionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
