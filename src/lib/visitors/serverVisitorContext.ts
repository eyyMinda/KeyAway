/** @fileoverview RSC: load `visitor` by hashed IP for spammer gate and optional welcome line from visit tier. */
import { client } from "@/src/sanity/lib/client";
import { getClientIpFromForwardedHeaders, hashIp } from "@/src/lib/api/requestGeo";
import type { VisitTier } from "@/src/lib/visitors/visitTier";

function welcomeLineForTier(tier: VisitTier | undefined): string | null {
  if (!tier || tier === "new") return null;
  switch (tier) {
    case "returning":
      return "Good to see you again — grab a key below.";
    case "regular":
      return "Thanks for coming back — here are the latest keys.";
    case "star":
      return "You're a regular — here's what's live right now.";
    default:
      return null;
  }
}

export async function getVisitorContextForPublicPage(headersList: Headers): Promise<{
  isSpammer: boolean;
  visitorWelcomeLine: string | null;
}> {
  const ip = getClientIpFromForwardedHeaders(headersList);
  const visitorHash = hashIp(ip);
  if (!visitorHash) {
    return { isSpammer: false, visitorWelcomeLine: null };
  }

  const doc = await client.fetch<{ isSpammer?: boolean; visitTier?: VisitTier } | null>(
    `*[_type == "visitor" && visitorHash == $h][0]{ isSpammer, visitTier }`,
    { h: visitorHash }
  );

  if (doc?.isSpammer === true) {
    return { isSpammer: true, visitorWelcomeLine: null };
  }

  return {
    isSpammer: false,
    visitorWelcomeLine: welcomeLineForTier(doc?.visitTier)
  };
}
