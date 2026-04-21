"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStoreDetails } from "@components/providers/StoreDetailsProvider";
import { resolveSupportEmail } from "@/src/lib/site/supportEmail";

function buildReportMailto(supportEmail: string, message: string): string {
  const subject = encodeURIComponent("[KeyAway] Site error report");
  const body = encodeURIComponent(message);
  return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
}

export default function GlobalRouteError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const supportEmail = resolveSupportEmail(useStoreDetails());

  const reportBody = useMemo(() => {
    const lines = [
      "I hit an error while using KeyAway.",
      "",
      `URL: ${typeof window !== "undefined" ? window.location.href : "(unknown)"}`,
      error.digest ? `Digest: ${error.digest}` : null,
      error.message ? `Message: ${error.message}` : null,
      "",
      "(Add anything else useful below.)"
    ].filter(Boolean) as string[];
    return lines.join("\n");
  }, [error.digest, error.message]);

  const mailtoHref = useMemo(() => buildReportMailto(supportEmail, reportBody), [reportBody, supportEmail]);

  return (
    <main className="min-h-screen bg-neutral-900 flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center">
        <div className="text-6xl font-bold text-amber-500 mb-4">!</div>
        <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
        <p className="text-neutral-300 mb-6 leading-relaxed">
          This page could not be loaded. The site may be having a temporary problem, or new content may not match the
          app yet. You can go back home, browse programs, or email the team with one click (opens your mail app).
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors">
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 text-neutral-100 font-semibold px-5 py-2.5 rounded-xl transition-colors">
            Home
          </Link>
          <Link
            href="/programs"
            className="inline-flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 text-neutral-100 font-semibold px-5 py-2.5 rounded-xl transition-colors">
            Programs
          </Link>
        </div>
        <a
          href={mailtoHref}
          className="inline-flex items-center justify-center text-primary-400 hover:text-primary-300 text-sm font-medium underline-offset-2 hover:underline">
          Email support ({supportEmail})
        </a>
      </div>
    </main>
  );
}
