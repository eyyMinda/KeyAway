"use client";

import Giscus from "@giscus/react";
import { trackEvent } from "@/src/lib/analytics/trackEvent";

export default function ProgramComments() {
  // Show fallback if Giscus fails to load (currently disabled)
  if (false) {
    return (
      <div className="py-6 text-center">
        <h3 className="mb-2 text-lg font-semibold text-[#c6d4df]">Comments temporarily unavailable</h3>
        <p className="mb-5 text-sm text-[#8f98a0]">Due to security policies, embedded comments are turned off.</p>
        <a
          href="https://github.com/eyyMinda/KeyAway/discussions"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackEvent("social_click", {
              social: "github keyaway",
              path: window.location.pathname
            });
          }}
          className="inline-flex items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a3a5c] px-5 py-2.5 text-sm font-semibold text-[#66c0f4] transition-colors hover:bg-[#213246]">
          View discussions on GitHub
        </a>
      </div>
    );
  }

  return (
    <div className="giscus-wrap min-h-48">
      <Giscus
        repo="eyyMinda/KeyAway"
        repoId="R_kgDOPrUr6Q"
        category="Announcements"
        categoryId="DIC_kwDOPrUr6c4CvFkJ"
        mapping="pathname"
        strict="1"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        lang="en"
        /* Neutral GitHub dark — sits cleanly on #1b2838 / #16202d (see giscus themes) */
        theme="dark"
        loading="lazy"
        term="Comments"
      />
    </div>
  );
}
