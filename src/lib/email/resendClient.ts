import { Resend } from "resend";

let resendClient: Resend | null | undefined;

export function getResendClient(): Resend | null {
  if (resendClient !== undefined) return resendClient;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    resendClient = null;
    return resendClient;
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

export function getResendFromAddress(): string | null {
  const from = process.env.RESEND_FROM?.trim();
  return from || null;
}

export function getResendReplyToAddress(fallback?: string): string | null {
  const replyTo = process.env.RESEND_REPLY_TO?.trim();
  if (replyTo) return replyTo;
  const fallbackTrimmed = fallback?.trim();
  return fallbackTrimmed && fallbackTrimmed.includes("@") ? fallbackTrimmed : null;
}

export function isResendConfigured(): boolean {
  return Boolean(getResendClient() && getResendFromAddress());
}
