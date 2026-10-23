/**
 * @fileoverview Portable Text <-> lightweight Markdown for the admin editor (and AI prefill output).
 *
 * Supported: paragraphs, `#`–`######` headings, `>` quotes, `-` / `1.` lists (2-space indent per level),
 * `**strong**`, `*em*`, `` `code` ``, `~~strike~~` and `[links](https://…)`. Anything else (underline,
 * custom marks or block types) cannot be written in this syntax; `isMarkdownLossless` reports that so the
 * editor can warn before a save would drop it.
 */
import type { PortableTextBlock } from "@portabletext/types";

type Span = { _type: "span"; _key: string; text: string; marks: string[] };
type MarkDef = { _type: string; _key: string; href?: string };
type Block = {
  _type: "block";
  _key: string;
  style: string;
  markDefs: MarkDef[];
  children: Span[];
  listItem?: "bullet" | "number";
  level?: number;
};

const DECORATOR_MD: Record<string, string> = { strong: "**", em: "*", code: "`", "strike-through": "~~" };

function mkKey(): string {
  return `k${Math.random().toString(36).slice(2, 11)}`;
}

function asBlocks(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value.filter(b => b && typeof b === "object") as Record<string, unknown>[]) : [];
}

// ---------------------------------------------------------------------------------------------------------
// Portable Text -> Markdown
// ---------------------------------------------------------------------------------------------------------

function escapeInline(text: string): string {
  return text.replace(/([\\*`[\]])/g, "\\$1").replace(/~~/g, "\\~\\~");
}

/** A paragraph that happens to start like a heading / list / quote must not turn into one. */
function escapeLineStart(text: string): string {
  return text
    .replace(/^(\s*)([#>+-])(?=\s)/, "$1\\$2")
    .replace(/^(\s*\d+)([.)])(?=\s)/, "$1\\$2");
}

function spansToMarkdown(block: Record<string, unknown>): string {
  const defs = new Map<string, MarkDef>();
  for (const d of asBlocks(block.markDefs)) {
    if (typeof d._key === "string") defs.set(d._key, d as MarkDef);
  }

  // Merge neighbours with identical marks so `**a****b**` never happens.
  const spans: { text: string; marks: string[] }[] = [];
  for (const c of asBlocks(block.children)) {
    const text = typeof c.text === "string" ? c.text : "";
    const marks = Array.isArray(c.marks) ? (c.marks as string[]) : [];
    const prev = spans[spans.length - 1];
    if (prev && prev.marks.join("|") === marks.join("|")) prev.text += text;
    else spans.push({ text, marks });
  }

  return spans
    .map(({ text, marks }) => {
      if (!text) return "";
      // Markers must hug the text: move edge whitespace outside them.
      const lead = text.match(/^\s*/)?.[0] ?? "";
      const trail = text.slice(lead.length).match(/\s*$/)?.[0] ?? "";
      const core = text.slice(lead.length, text.length - trail.length);
      if (!core) return text;
      const isCode = marks.includes("code");
      let out = isCode ? core : escapeInline(core);
      for (const m of marks) {
        const md = DECORATOR_MD[m];
        if (md) out = `${md}${out}${md}`;
        else if (defs.get(m)?._type === "link" && defs.get(m)?.href) out = `[${out}](${defs.get(m)!.href})`;
      }
      return `${lead}${out}${trail}`;
    })
    .join("")
    .replace(/^\n+|\n+$/g, "") // invisible when rendered
    .split("\n")
    .map((line, i) => (i === 0 ? line : escapeLineStart(line)))
    .join("\\\n");
}

/** Portable Text (or a legacy plain string) to the editor's Markdown. */
export function portableTextToMarkdown(value: unknown): string {
  if (typeof value === "string") return value.trim();
  const blocks = asBlocks(value).filter(b => b._type === "block");
  let out = "";
  let prevList = false;
  const numberCounters: number[] = [];

  for (const block of blocks) {
    const text = spansToMarkdown(block);
    const listItem = block.listItem as string | undefined;
    const level = typeof block.level === "number" && block.level > 0 ? block.level : 1;
    const style = typeof block.style === "string" ? block.style : "normal";
    let line: string;

    if (listItem === "bullet" || listItem === "number") {
      const indent = "  ".repeat(level - 1);
      numberCounters.length = level;
      numberCounters[level - 1] = (numberCounters[level - 1] ?? 0) + 1;
      // Line breaks inside an item continue under its text, indented past the marker.
      line = `${indent}${listItem === "number" ? `${numberCounters[level - 1]}.` : "-"} ${text.replace(/\n/g, `\n${indent}  `)}`;
      out += out ? (prevList ? "\n" : "\n\n") : "";
      prevList = true;
    } else {
      numberCounters.length = 0;
      const heading = /^h([1-6])$/.exec(style);
      if (heading) line = `${"#".repeat(Number(heading[1]))} ${text}`;
      else if (style === "blockquote") line = `> ${text}`;
      else line = escapeLineStart(text);
      out += out ? "\n\n" : "";
      prevList = false;
    }
    out += line;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// Markdown -> Portable Text
// ---------------------------------------------------------------------------------------------------------

const INLINE_RULES: { re: RegExp; mark: string; recurse: boolean }[] = [
  { re: /^\*\*(?=\S)([\s\S]*?\S)\*\*/, mark: "strong", recurse: true },
  { re: /^~~(?=\S)([\s\S]*?\S)~~/, mark: "strike-through", recurse: true },
  { re: /^`([^`]+)`/, mark: "code", recurse: false },
  { re: /^\*(?=\S)([\s\S]*?\S)\*(?!\*)/, mark: "em", recurse: true }
];
const LINK_RE = /^\[((?:\\.|[^\]\\])+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+|\/[^)\s]*)\)/;

function parseInline(text: string, marks: string[], markDefs: MarkDef[], out: { text: string; marks: string[] }[]) {
  let buf = "";
  const flush = () => {
    if (buf) out.push({ text: buf, marks });
    buf = "";
  };
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    const esc = /^\\([\\*`[\]~#>+\-.)_])/.exec(rest);
    if (esc) {
      buf += esc[1];
      i += esc[0].length;
      continue;
    }
    const link = LINK_RE.exec(rest);
    if (link) {
      flush();
      const def: MarkDef = { _type: "link", _key: mkKey(), href: link[2] };
      markDefs.push(def);
      parseInline(link[1], [...marks, def._key], markDefs, out);
      i += link[0].length;
      continue;
    }
    const rule = INLINE_RULES.find(r => r.re.test(rest));
    if (rule) {
      const m = rule.re.exec(rest)!;
      flush();
      if (rule.recurse) parseInline(m[1], [...marks, rule.mark], markDefs, out);
      else out.push({ text: m[1], marks: [...marks, rule.mark] });
      i += m[0].length;
      continue;
    }
    buf += text[i];
    i++;
  }
  flush();
}

function makeBlock(text: string, style: string, list?: { listItem: "bullet" | "number"; level: number }): Block {
  const markDefs: MarkDef[] = [];
  const raw: { text: string; marks: string[] }[] = [];
  parseInline(text, [], markDefs, raw);
  const children: Span[] = [];
  for (const s of raw) {
    const prev = children[children.length - 1];
    if (prev && prev.marks.join("|") === s.marks.join("|")) prev.text += s.text;
    else children.push({ _type: "span", _key: mkKey(), text: s.text, marks: s.marks });
  }
  if (children.length === 0) children.push({ _type: "span", _key: mkKey(), text: "", marks: [] });
  return {
    _type: "block",
    _key: mkKey(),
    style,
    markDefs,
    children,
    ...(list ? { listItem: list.listItem, level: list.level } : {})
  };
}

/** Editor Markdown to Portable Text blocks. Single newlines inside a paragraph become spaces unless the line ends in `\`. */
export function markdownToPortableText(markdown: string): PortableTextBlock[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  // Lines of the paragraph or list item being collected.
  let para: string[] = [];
  let item: { listItem: "bullet" | "number"; level: number } | undefined;
  const flushPara = () => {
    // A line ending in an unescaped `\` keeps its line break; other line breaks become spaces.
    let text = "";
    for (const line of para) {
      const hardBreak = /(^|[^\\])(\\\\)*\\$/.test(text);
      text = !text ? line : hardBreak ? `${text.slice(0, -1)}\n${line}` : `${text} ${line}`;
    }
    text = text.replace(/(^|[^\\])\\$/, "$1").trim(); // a break with nothing after it
    if (text || item) blocks.push(makeBlock(text, "normal", item));
    para = [];
    item = undefined;
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushPara();
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const quote = /^>\s?(.*)$/.exec(line);
    const list = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (heading) {
      flushPara();
      blocks.push(makeBlock(heading[2].trim(), `h${heading[1].length}`));
    } else if (quote) {
      flushPara();
      blocks.push(makeBlock(quote[1].trim(), "blockquote"));
    } else if (list) {
      flushPara();
      const level = Math.floor(list[1].replace(/\t/g, "  ").length / 2) + 1;
      item = { listItem: /^\d/.test(list[2]) ? "number" : "bullet", level };
      para.push(list[3].trim());
    } else if (item && !/^\s+\S/.test(line)) {
      // An unindented line ends the list item and starts a paragraph.
      flushPara();
      para.push(line.trim());
    } else {
      para.push(line.trim());
    }
  }
  flushPara();
  return blocks as unknown as PortableTextBlock[];
}

// ---------------------------------------------------------------------------------------------------------
// Round-trip check
// ---------------------------------------------------------------------------------------------------------

/**
 * Shape that matters for rendering: styles, lists, text and which marks cover each visible character.
 * Keys, link keys, empty paragraphs and marks on whitespace (`**Bold: **` vs `**Bold:** `) are ignored.
 */
function canonical(value: unknown): string {
  if (typeof value === "string") return canonical(markdownToPortableText(value));
  return JSON.stringify(
    asBlocks(value).map(b => {
      const defs = new Map(asBlocks(b.markDefs).map(d => [d._key as string, d]));
      let text = "";
      const runs: { m: string; n: number }[] = [];
      for (const c of asBlocks(b.children)) {
        const m = (Array.isArray(c.marks) ? (c.marks as string[]) : [])
          .map(k => (defs.has(k) ? `${defs.get(k)!._type}:${defs.get(k)!.href ?? ""}` : k))
          .sort()
          .join("|");
        const t = typeof c.text === "string" ? c.text : `[${String(c._type)}]`;
        text += t;
        for (const ch of t) {
          if (!ch.trim()) continue;
          const prev = runs[runs.length - 1];
          if (prev && prev.m === m) prev.n++;
          else runs.push({ m, n: 1 });
        }
      }
      return {
        type: b._type,
        style: typeof b.style === "string" ? b.style : "normal",
        list: b.listItem ?? null,
        level: b.listItem ? (b.level ?? 1) : null,
        text: text.trim(),
        runs
      };
    })
      // Empty paragraphs render as nothing.
      .filter(b => b.text || b.list)
  );
}

/** True when editing this value as Markdown and saving it back keeps every block, style and mark. */
export function isMarkdownLossless(value: unknown): boolean {
  if (value == null || typeof value === "string") return true;
  return canonical(value) === canonical(markdownToPortableText(portableTextToMarkdown(value)));
}
