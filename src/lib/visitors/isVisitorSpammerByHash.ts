/** @fileoverview Read `visitor.isSpammer` by hash; used before accepting public key reports. */
import { client } from "@/src/sanity/lib/client";

export async function isVisitorSpammerByHash(visitorHash: string | undefined): Promise<boolean> {
  if (!visitorHash) return false;
  const row = await client.fetch<{ isSpammer?: boolean } | null>(
    `*[_type == "visitor" && visitorHash == $h][0]{ isSpammer }`,
    { h: visitorHash }
  );
  return row?.isSpammer === true;
}
