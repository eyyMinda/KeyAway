import {
  type AdminReplyMailtoOptions,
  buildAdminReplyMailto,
  buildAdminReplyTemplate
} from "@/src/lib/email/adminReplyMailto";

export async function copyAdminReplyTemplate(htmlBody: string, plainTextBody: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;

  try {
    if (typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([htmlBody], { type: "text/html" }),
          "text/plain": new Blob([plainTextBody], { type: "text/plain" })
        })
      ]);
      return true;
    }

    await navigator.clipboard.writeText(plainTextBody);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(plainTextBody);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Copies the rich HTML reply to clipboard, then opens the default mail client.
 * mailto: only supports plain text — paste (Ctrl+V) in the compose window for formatting.
 */
export async function openAdminReplyEmail(options: AdminReplyMailtoOptions): Promise<boolean> {
  const template = buildAdminReplyTemplate(options);
  const copied = await copyAdminReplyTemplate(template.htmlBody, template.plainTextBody);

  const mailtoUrl = buildAdminReplyMailto(options);
  window.open(mailtoUrl, "_blank", "noopener,noreferrer");

  return copied;
}
