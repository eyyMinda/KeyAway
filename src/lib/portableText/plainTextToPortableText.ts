import type { PortableTextBlock } from "@portabletext/types";

function mkKey(): string {
  return `k${Math.random().toString(36).slice(2, 11)}`;
}

/** Admin / API: turn a textarea string into Sanity Portable Text (paragraphs from blank-line breaks). */
export function plainTextToPortableText(text: string): PortableTextBlock[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n\s*\n+/);
  return paragraphs.map(paragraph => ({
    _type: "block",
    _key: mkKey(),
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: mkKey(),
        text: paragraph.replace(/\n/g, " ").trim(),
        marks: []
      }
    ]
  })) as PortableTextBlock[];
}
