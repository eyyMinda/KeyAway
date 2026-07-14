"use client";

import { useMemo } from "react";
import { useStoreDetails } from "@/src/components/providers/StoreDetailsProvider";
import { buildAdminReplyHtmlBody, buildReplySubject } from "@/src/lib/email/adminReplyMailto";
import { resolveEmailFooterLinks } from "@/src/lib/email/resolveEmailFooterLinks";
import { resolveSiteBaseUrl } from "@/src/lib/seo/storeSeoResolve";

const SAMPLE = {
  recipientName: "Alex",
  subject: "Example program",
  adminReply: "Here is the info you asked for — let us know if you need anything else.",
  originalMessage: "Do you have a working key for Example Pro?"
};

export default function ReplyEmailTemplatePreview() {
  const storeData = useStoreDetails();

  const subject = useMemo(() => buildReplySubject(SAMPLE.subject), []);
  const htmlBody = useMemo(
    () =>
      buildAdminReplyHtmlBody({
        subject: SAMPLE.subject,
        recipientName: SAMPLE.recipientName,
        adminReply: SAMPLE.adminReply,
        originalMessage: SAMPLE.originalMessage,
        siteBaseUrl: resolveSiteBaseUrl(storeData?.seo),
        storeTitle: storeData?.title,
        footerLinks: resolveEmailFooterLinks(storeData)
      }),
    [storeData]
  );

  return (
    <section className="mt-8 md:mt-12">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Reply email preview</h3>
        <p className="mt-1 text-sm text-gray-500">
          Sample of the HTML visitors receive when you send a reply. Footer buttons pull from Sanity store settings.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium text-gray-700">Subject:</span> {subject}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Email body preview
        </div>
        <iframe
          title="Reply email template preview"
          srcDoc={htmlBody}
          className="block w-full min-h-[440px] border-0 bg-white"
          sandbox="allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </section>
  );
}
