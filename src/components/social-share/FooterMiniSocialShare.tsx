"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import SocialShare from "@/src/components/social-share/SocialShare";
import { buildPageShareInput } from "@/src/lib/share/buildSharePayload";

type FooterMiniSocialShareProps = {
  siteBaseUrl: string;
};

export default function FooterMiniSocialShare({ siteBaseUrl }: FooterMiniSocialShareProps) {
  const pathname = usePathname();
  const [documentTitle, setDocumentTitle] = useState<string>();

  useEffect(() => {
    setDocumentTitle(document.title);
  }, [pathname]);

  const shareInput = useMemo(() => {
    const pageUrl = `${siteBaseUrl}${pathname}`;
    return buildPageShareInput(pageUrl, documentTitle);
  }, [siteBaseUrl, pathname, documentTitle]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/studio")) {
    return null;
  }

  const shareId = `footer${pathname.replace(/\//g, "-") || "-home"}`;

  return (
    <SocialShare
      variant="mini"
      shareId={shareId}
      shareInput={shareInput}
      ariaLabel="Share this page"
      showCounts={false}
    />
  );
}
