import { DEFAULT_SITE_URL } from "@/src/lib/seo/storeSeoResolve";
import type { EmailFooterLinks } from "@/src/lib/email/resolveEmailFooterLinks";

const LOGO_PATH = "/images/KeyAway_Logo_White.png";
const TRUSTPILOT_LOGO_PATH = "/images/Trustpilot_Logo.png";
const DEFAULT_STORE_TITLE = "KeyAway";
const PLAIN_LINE_BREAK = "\r\n";
const FACEBOOK_TAGLINE = "Get notified about new programs & CD keys";
const OPENING_THANKS = "Thanks for reaching out!";
const FOOTER_BG = "#0E141B";
const FOOTER_GRADIENT = "linear-gradient(180deg,#1b2838 0%,#0E141B 100%)";
const FOOTER_BG_STYLE = `background-color:${FOOTER_BG};background-image:${FOOTER_GRADIENT};`;

const EMAIL_HEAD_STYLES = `<style type="text/css">
  .footer-shell { width: 100%; max-width: 420px; margin: 0 auto; text-align: center; }
</style>`;

const FOOTER_CTA_MAX_WIDTH = 300;

export interface AdminReplyMailtoOptions {
  to: string;
  subject: string;
  originalMessage?: string | null;
  adminReply?: string | null;
  recipientName?: string | null;
  siteBaseUrl?: string;
  storeTitle?: string | null;
  footerLinks?: EmailFooterLinks | null;
}

export interface AdminReplyTemplate {
  subject: string;
  htmlBody: string;
  plainTextBody: string;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildReplySubject(originalTitle: string | undefined | null): string {
  const title = originalTitle?.trim() || "Your message";
  if (/^re:\s*/i.test(title)) return title;
  return `RE: ${title}`;
}

function buildGreetingPlain(recipientName?: string | null): string {
  const name = recipientName?.trim();
  return name ? `Hi ${name},` : "Hi there,";
}

function buildGreetingHtml(recipientName?: string | null): string {
  return escapeHtml(buildGreetingPlain(recipientName));
}

function buildSignOffPlain(storeTitle: string): string[] {
  return ["", "Kind regards,", `${storeTitle} Support`];
}

function buildSignOffHtml(storeTitle: string): string {
  return `<p style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#333;margin:0 0 16px;line-height:1.5;">Kind regards,<br />${escapeHtml(storeTitle)} Support</p>`;
}

function buildOpeningPlain(recipientName?: string | null): string[] {
  return [buildGreetingPlain(recipientName), "", OPENING_THANKS, ""];
}

function buildOpeningHtml(recipientName?: string | null): string {
  return [
    `<p style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#333;margin:0 0 12px;">${buildGreetingHtml(recipientName)}</p>`,
    `<p style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#333;margin:0 0 16px;line-height:1.5;">${escapeHtml(OPENING_THANKS)}</p>`
  ].join("");
}

function normalizeBaseUrl(siteBaseUrl?: string): string {
  const raw = siteBaseUrl?.trim() || DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

function formatMultilineHtml(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

function quotePlainLines(message: string): string {
  return message
    .split(/\r?\n/)
    .map(line => `> ${line}`)
    .join(PLAIN_LINE_BREAK);
}

function buildQuotedMessagePlain(originalMessage?: string | null, recipientName?: string | null): string {
  const message = originalMessage?.trim();
  if (!message) return "";

  const name = recipientName?.trim();
  const attribution = name ? `${name} wrote:${PLAIN_LINE_BREAK}` : "";
  return `${attribution}${quotePlainLines(message)}`;
}

function buildQuotedMessageHtml(originalMessage?: string | null, recipientName?: string | null): string {
  const message = originalMessage?.trim();
  if (!message) return "";

  const name = recipientName?.trim();
  const attribution = name
    ? `<p style="margin:0 0 8px;font-family:Segoe UI,Arial,sans-serif;font-size:12px;color:#8f98a0;">${escapeHtml(name)} wrote:</p>`
    : "";

  return [
    `<div style="margin:0 0 24px;">`,
    attribution,
    `<blockquote style="margin:0;padding:12px 16px;border-left:4px solid #2a475e;background-color:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;font-size:13px;line-height:1.5;color:#4b5563;">`,
    formatMultilineHtml(message),
    `</blockquote>`,
    `</div>`
  ].join("");
}

function buildAdminReplyContentPlain(adminReply: string | null | undefined, storeTitle: string): string[] {
  const reply = adminReply?.trim();
  if (reply) {
    return [reply, ...buildSignOffPlain(storeTitle)];
  }
  return ["", "", ...buildSignOffPlain(storeTitle)];
}

function buildAdminReplyContentHtml(adminReply: string | null | undefined, storeTitle: string): string {
  const reply = adminReply?.trim();
  const signOffHtml = buildSignOffHtml(storeTitle);

  if (reply) {
    return [
      `<p style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#333;margin:0 0 16px;line-height:1.5;">${formatMultilineHtml(reply)}</p>`,
      signOffHtml
    ].join("");
  }

  return [
    `<p style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#333;margin:0 0 12px;">&nbsp;</p>`,
    `<p style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#333;margin:0 0 12px;">&nbsp;</p>`,
    signOffHtml
  ].join("");
}

function footerCtaSlot(content: string, marginTop = 10): string {
  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${FOOTER_CTA_MAX_WIDTH}" align="center"`,
    ` style="width:100%;max-width:${FOOTER_CTA_MAX_WIDTH}px;margin:${marginTop}px auto 0;">`,
    `<tr><td align="center" style="padding:0;">`,
    content,
    `</td></tr>`,
    `</table>`
  ].join("");
}

function footerBlockLink(
  href: string,
  innerHtml: string,
  bg: string,
  color: string,
  border: string,
  compact = false
): string {
  const pad = compact ? "9px 10px" : "11px 16px";
  const size = compact ? "12px" : "13px";
  return [
    `<a href="${escapeHtml(href)}" style="display:block;width:100%;padding:${pad};background-color:${bg};color:${color};`,
    `text-decoration:none;font-family:Segoe UI,Arial,sans-serif;font-size:${size};font-weight:600;border-radius:4px;`,
    `border:1px solid ${border};line-height:1.35;text-align:center;box-sizing:border-box;">`,
    innerHtml,
    `</a>`
  ].join("");
}

function facebookJoinGroupLink(url: string): string {
  const inner = [
    `<table cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="margin:0 auto;">`,
    `<tr>`,
    `<td style="padding:0 8px 0 0;vertical-align:middle;line-height:0;">`,
    `<span style="display:inline-block;width:18px;height:18px;line-height:18px;background:#ffffff;color:#2563eb;border-radius:4px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;text-align:center;">f</span>`,
    `</td>`,
    `<td style="vertical-align:middle;font-family:Segoe UI,Arial,sans-serif;font-size:13px;font-weight:600;color:#ffffff;white-space:nowrap;">Join Group</td>`,
    `</tr>`,
    `</table>`
  ].join("");
  return footerBlockLink(url, inner, "#2563eb", "#ffffff", "#3b82f6");
}

function trustpilotReviewLink(url: string, trustpilotLogoUrl: string): string {
  const inner = [
    `<span style="vertical-align:middle;">Leave a review on</span>`,
    ` <img src="${escapeHtml(trustpilotLogoUrl)}" alt="Trustpilot" width="72" height="18"`,
    ` style="vertical-align:middle;border:0;display:inline-block;margin-left:4px;" />`
  ].join("");
  return footerBlockLink(url, inner, "#f3f4f6", "#111827", "#d1d5db");
}

function footerDivider(): string {
  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${FOOTER_CTA_MAX_WIDTH}" align="center"`,
    ` style="width:100%;max-width:${FOOTER_CTA_MAX_WIDTH}px;margin:16px auto;">`,
    `<tr><td style="border-top:1px solid #2a475e;font-size:0;line-height:0;">&nbsp;</td></tr>`,
    `</table>`
  ].join("");
}

function footerSupportRow(githubUrl: string | null | undefined, buyMeACoffeeUrl: string | null | undefined): string {
  if (!githubUrl && !buyMeACoffeeUrl) return "";

  const cells: string[] = [];
  if (githubUrl) {
    cells.push(
      footerBlockLink(githubUrl, "&#11088; on GitHub", "#213246", "#f3f4f6", "#2a475e", true)
    );
  }
  if (buyMeACoffeeUrl) {
    cells.push(
      footerBlockLink(buyMeACoffeeUrl, "&#129365; Carrot Juice", "#7d3315", "#ffffff", "#a3421b", true)
    );
  }

  if (cells.length === 1) {
    return footerCtaSlot(cells[0]!, 10);
  }

  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${FOOTER_CTA_MAX_WIDTH}" align="center"`,
    ` style="width:100%;max-width:${FOOTER_CTA_MAX_WIDTH}px;margin:10px auto 0;">`,
    `<tr>`,
    cells
      .map(
        (cell, i) =>
          `<td width="50%" align="center" valign="top" style="padding:${i === 0 ? "0 4px 0 0" : "0 0 0 4px"};">${cell}</td>`
      )
      .join(""),
    `</tr>`,
    `</table>`
  ].join("");
}

function buildFooterLinksPlain(links: EmailFooterLinks): string[] {
  const lines: string[] = [];

  if (links.facebookGroupUrl) {
    lines.push(`Join our Facebook group: ${links.facebookGroupUrl}`);
    lines.push(FACEBOOK_TAGLINE);
  }
  if (links.trustpilotUrl) {
    lines.push(`Leave a review on Trustpilot: ${links.trustpilotUrl}`);
  }
  if (links.githubRepoUrl) {
    lines.push(`Star on GitHub: ${links.githubRepoUrl}`);
  }
  if (links.buyMeACoffeeUrl) {
    lines.push(`Buy us carrot juice: ${links.buyMeACoffeeUrl}`);
  }

  return lines;
}

/** Branded footer — included on every outbound reply (Resend + mailto plain-text). */
function buildEmailFooterHtml(
  baseUrl: string,
  storeTitle: string,
  programsUrl: string,
  logoUrl: string,
  trustpilotLogoUrl: string,
  links: EmailFooterLinks
): string {
  const blocks: string[] = [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;${FOOTER_BG_STYLE}border-collapse:collapse;">`,
    `<tr><td style="padding:20px 16px;${FOOTER_BG_STYLE}">`,
    `<div class="footer-shell">`,
    `<a href="${escapeHtml(baseUrl)}" style="text-decoration:none;">`,
    `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(storeTitle)}" width="112" style="display:block;margin:0 auto 8px;border:0;max-width:112px;height:auto;" />`,
    `</a>`,
    `<p style="margin:0 auto 4px;max-width:320px;font-family:Segoe UI,Arial,sans-serif;font-size:13px;line-height:1.45;color:#8f98a0;">Free giveaway CD keys for your favorite software.</p>`,
    footerDivider(),
    footerCtaSlot(footerBlockLink(programsUrl, "View all programs", "#1a3a5c", "#c6d4df", "#4a90c4"), 0)
  ];

  if (links.facebookGroupUrl) {
    blocks.push(
      footerCtaSlot(facebookJoinGroupLink(links.facebookGroupUrl)),
      `<p style="margin:6px auto 0;max-width:${FOOTER_CTA_MAX_WIDTH}px;font-family:Segoe UI,Arial,sans-serif;font-size:11px;line-height:1.35;color:#8f98a0;">${escapeHtml(FACEBOOK_TAGLINE)}</p>`
    );
  }

  if (links.trustpilotUrl) {
    blocks.push(footerCtaSlot(trustpilotReviewLink(links.trustpilotUrl, trustpilotLogoUrl)));
  }

  blocks.push(
    footerSupportRow(links.githubRepoUrl, links.buyMeACoffeeUrl),
    `<p style="margin:14px 0 0;font-family:Segoe UI,Arial,sans-serif;font-size:11px;line-height:1.3;color:#8f98a0;">&copy; ${new Date().getFullYear()} ${escapeHtml(storeTitle)}</p>`,
    `</div>`,
    `</td></tr></table>`
  );

  return blocks.join("");
}

export function buildAdminReplyPlainTextBody(options: Omit<AdminReplyMailtoOptions, "to">): string {
  const baseUrl = normalizeBaseUrl(options.siteBaseUrl);
  const storeTitle = options.storeTitle?.trim() || DEFAULT_STORE_TITLE;
  const programsUrl = `${baseUrl}/programs`;
  const footerLinks = options.footerLinks ?? {};
  const opening = buildOpeningPlain(options.recipientName);
  const adminContent = buildAdminReplyContentPlain(options.adminReply, storeTitle);
  const quotedMessage = buildQuotedMessagePlain(options.originalMessage, options.recipientName);
  const footerLinkLines = buildFooterLinksPlain(footerLinks);

  const lines = [
    ...opening,
    ...adminContent,
    quotedMessage,
    quotedMessage ? "" : null,
    "--",
    storeTitle,
    "Free giveaway CD keys for your favorite software.",
    "",
    `View all programs: ${programsUrl}`,
    footerLinkLines.length > 0 ? "" : null,
    ...footerLinkLines,
    "",
    `${storeTitle} · ${baseUrl}`
  ].filter((line): line is string => line != null);

  return lines.join(PLAIN_LINE_BREAK);
}

export function buildAdminReplyHtmlBody(options: Omit<AdminReplyMailtoOptions, "to">): string {
  const baseUrl = normalizeBaseUrl(options.siteBaseUrl);
  const storeTitle = options.storeTitle?.trim() || DEFAULT_STORE_TITLE;
  const programsUrl = `${baseUrl}/programs`;
  const logoUrl = `${baseUrl}${LOGO_PATH}`;
  const trustpilotLogoUrl = `${baseUrl}${TRUSTPILOT_LOGO_PATH}`;
  const footerLinks = options.footerLinks ?? {};
  const openingHtml = buildOpeningHtml(options.recipientName);
  const adminContentHtml = buildAdminReplyContentHtml(options.adminReply, storeTitle);
  const quotedMessageHtml = buildQuotedMessageHtml(options.originalMessage, options.recipientName);
  const footerHtml = buildEmailFooterHtml(baseUrl, storeTitle, programsUrl, logoUrl, trustpilotLogoUrl, footerLinks);

  const inner = [
    `<div style="padding:16px 20px;max-width:640px;margin:0 auto;">`,
    openingHtml,
    adminContentHtml,
    quotedMessageHtml,
    `</div>`,
    footerHtml
  ].join("");

  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" />${EMAIL_HEAD_STYLES}</head><body style="margin:0;padding:0;width:100%;background:#ffffff;">${inner}</body></html>`;
}

export function buildAdminReplyTemplate(options: Omit<AdminReplyMailtoOptions, "to">): AdminReplyTemplate {
  return {
    subject: buildReplySubject(options.subject),
    htmlBody: buildAdminReplyHtmlBody(options),
    plainTextBody: buildAdminReplyPlainTextBody(options)
  };
}

/** Plain-text mailto only — HTML is not supported by the mailto spec. */
export function buildAdminReplyMailto(options: AdminReplyMailtoOptions): string {
  const to = encodeURIComponent(options.to.trim());
  const template = buildAdminReplyTemplate(options);
  const subject = encodeURIComponent(template.subject);
  const body = encodeURIComponent(template.plainTextBody);

  return `mailto:${to}?subject=${subject}&body=${body}`;
}
