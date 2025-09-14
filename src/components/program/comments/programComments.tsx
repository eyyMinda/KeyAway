"use client";

import Giscus from "@giscus/react";
import { trackEvent } from "@/src/lib/trackEvent";

export default function ProgramComments() {
  // Show fallback if Giscus fails to load (currently disabled)
  if (false) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">💬</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Comments Temporarily Unavailable</h3>
        <p className="text-gray-600 mb-4">Due to security policies, comments are temporarily unavailable.</p>
        <a
          href="https://github.com/eyyMinda/keyaway/discussions"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackEvent("social_click", {
              social: "github keyaway",
              path: window.location.pathname
            });
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          View Discussions on GitHub
        </a>
      </div>
    );
  }

  return (
    <Giscus
      repo="eyyMinda/keyaway"
      repoId="R_kgDOPrUr6Q"
      category="Announcements"
      categoryId="DIC_kwDOPrUr6c4CvFkJ"
      mapping="pathname"
      strict="1"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      lang="en"
      theme="catppuccin_macchiato"
      loading="lazy"
      term="Comments"
    />
  );
}
