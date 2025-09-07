"use client";

import Giscus from "@giscus/react";

export default function ProgramComments() {
  return (
    <Giscus
      repo="your-github/repo"
      repoId="YOUR_REPO_ID"
      category="General"
      categoryId="YOUR_CATEGORY_ID"
      mapping="pathname"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="bottom"
      theme="light"
      lang="en"
    />
  );
}
