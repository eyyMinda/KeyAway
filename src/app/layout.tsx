import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { client } from "@/src/sanity/lib/client";
import { storeDetailsQuery } from "@lib/queries";
import Header from "@components/Header";
import Footer from "@components/Footer";
import { LogoData } from "@/src/types/global";
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

export const metadata: Metadata = {
  title: "KeyAway - Free Giveaway CD Keys",
  description: "Free Giveaway CD Keys"
};

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
  const logoData: LogoData = {
    src: urlFor(storeData?.logo).url(),
    alt: storeData?.title,
    width: getImageDimensions(storeData?.logo).width,
    height: getImageDimensions(storeData?.logo).height,
    blurDataURL: urlFor(storeData?.logo).width(24).height(24).blur(10).url()
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="mainContent flex flex-col min-h-screen">
          <Header storeData={storeData} logoData={logoData} />
          {children}
          <Footer storeData={storeData} logoData={logoData} />
        </div>
      </body>
    </html>
  );
}
