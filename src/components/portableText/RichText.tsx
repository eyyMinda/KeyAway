"use client";

import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

import { portableTextHasContent } from "@/src/lib/portableText/toPlainText";

function valueToBlocks(value: unknown): PortableTextBlock[] | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return null;
    return [
      {
        _type: "block",
        _key: "legacy-str",
        style: "normal",
        markDefs: [],
        children: [{ _type: "span", _key: "legacy-span", text: t, marks: [] }]
      } as PortableTextBlock
    ];
  }
  if (Array.isArray(value) && value.length > 0) return value as PortableTextBlock[];
  if (typeof value === "object" && value !== null && "_type" in value) {
    return [value as PortableTextBlock];
  }
  return null;
}

const components: Partial<PortableTextComponents> = {
  marks: {
    link: ({ children, value }) => {
      const href = typeof value?.href === "string" ? value.href : "";
      if (!href) return <span>{children}</span>;
      const external = /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
      return (
        <a
          href={href}
          className="text-primary-400 underline decoration-primary-400/60 underline-offset-2 hover:text-primary-300"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {children}
        </a>
      );
    },
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-[0.9em] text-gray-200">{children}</code>
    ),
    underline: ({ children }) => <span className="underline">{children}</span>,
    "strike-through": ({ children }) => <span className="line-through opacity-80">{children}</span>
  },
  block: {
    normal: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
    h1: ({ children }) => <h4 className="mb-2 mt-4 text-2xl font-bold first:mt-0">{children}</h4>,
    h2: ({ children }) => <h4 className="mb-2 mt-4 text-xl font-bold first:mt-0">{children}</h4>,
    h3: ({ children }) => <h4 className="mb-2 mt-3 text-lg font-semibold first:mt-0">{children}</h4>,
    h4: ({ children }) => <h4 className="mb-2 mt-3 text-base font-semibold first:mt-0">{children}</h4>,
    blockquote: ({ children }) => (
      <blockquote className="my-3 border-l-4 border-primary-500/60 pl-4 opacity-90 italic">{children}</blockquote>
    )
  },
  list: {
    bullet: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
    number: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>
  }
};

export default function RichText({ value, className }: { value: unknown; className?: string }) {
  const blocks = valueToBlocks(value);
  if (!blocks || !portableTextHasContent(blocks)) return null;
  return (
    <div className={className}>
      <PortableText value={blocks} components={components} />
    </div>
  );
}
