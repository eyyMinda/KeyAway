/** @fileoverview RSC: load `visitor` by hashed IP for spammer gate and optional visitor hint payload. */
import { client } from "@/src/sanity/lib/client";
import { getClientIpFromForwardedHeaders, hashIp } from "@/src/lib/api/requestGeo";
import { buildVisitorHintData } from "@/src/lib/visitors/buildVisitorHintData";
import type { VisitTier } from "@/src/lib/visitors/visitTier";
import type { PublicVisitorContext } from "@/src/lib/visitors/publicVisitorContext";

export async function getVisitorContextForPublicPage(headersList: Headers): Promise<PublicVisitorContext> {
  const ip = getClientIpFromForwardedHeaders(headersList);
  const visitorHash = hashIp(ip);
  if (!visitorHash) {
    return { isSpammer: false, visitorHint: null };
  }

  const doc = await client.fetch<{
    isSpammer?: boolean;
    visitTier?: VisitTier;
    visitCount?: number;
    reportCount?: number;
    suggestionCount?: number;
  } | null>(
    `*[_type == "visitor" && visitorHash == $h][0]{ isSpammer, visitTier, visitCount, reportCount, suggestionCount }`,
    { h: visitorHash }
  );

  if (doc?.isSpammer === true) {
    return {
      isSpammer: true,
      visitorHint: null
    };
  }

  if (!doc?.visitTier) {
    return { isSpammer: false, visitorHint: null };
  }

  const visitorHint = buildVisitorHintData({
    visitTier: doc.visitTier,
    visitCount: doc.visitCount ?? 0,
    reportCount: doc.reportCount ?? 0,
    suggestionCount: doc.suggestionCount ?? 0
  });

  return {
    isSpammer: false,
    visitorHint
  };
}
