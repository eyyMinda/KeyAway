"use client";

import Giscus from "@giscus/react";

export default function ProgramComments() {
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
    />
  );
}
