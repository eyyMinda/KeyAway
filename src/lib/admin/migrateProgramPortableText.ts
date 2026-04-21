import type { PortableTextBlock } from "@portabletext/types";

import { plainTextToPortableText } from "@/src/lib/portableText/plainTextToPortableText";

/** Minimal program row from GROQ for migration. */
export type ProgramPortableMigrationSource = {
  _id: string;
  description?: unknown;
  aboutSections?: unknown;
  faq?: unknown;
  featured?: unknown;
};

function textToBlocks(value: unknown): PortableTextBlock[] | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t ? plainTextToPortableText(t) : [];
}

/**
 * Returns patch payload fields for `client.patch(id).set(...)` plus optional `unset` paths.
 * No-op when document already matches portable-only shapes for all watched fields.
 */
export function buildProgramPortableTextMigration(
  doc: ProgramPortableMigrationSource
): { set: Record<string, unknown>; unset: string[] } | null {
  const set: Record<string, unknown> = {};
  const unset: string[] = [];
  let changed = false;

  if (typeof doc.description === "string") {
    const blocks = textToBlocks(doc.description);
    if (blocks !== undefined) {
      set.description = blocks;
      changed = true;
    }
  }

  if (Array.isArray(doc.aboutSections)) {
    let aboutChanged = false;
    const nextSections = doc.aboutSections.map((sec: Record<string, unknown>) => {
      const s = { ...sec };
      if (typeof s.description === "string") {
        const blocks = textToBlocks(s.description);
        if (blocks !== undefined) {
          s.description = blocks;
          aboutChanged = true;
        }
      }
      if (Array.isArray(s.points)) {
        s.points = (s.points as Record<string, unknown>[]).map(pt => {
          const p = { ...pt };
          if (typeof p.text === "string") {
            const blocks = textToBlocks(p.text);
            if (blocks !== undefined) {
              p.text = blocks;
              aboutChanged = true;
            }
          }
          return p;
        });
      }
      return s;
    });
    if (aboutChanged) {
      set.aboutSections = nextSections;
      changed = true;
    }
  }

  if (Array.isArray(doc.faq)) {
    let faqChanged = false;
    const nextFaq = (doc.faq as Record<string, unknown>[]).map(item => {
      const row = { ...item };
      if (typeof row.answer === "string") {
        const blocks = textToBlocks(row.answer);
        if (blocks !== undefined) {
          row.answer = blocks;
          faqChanged = true;
        }
      }
      return row;
    });
    if (faqChanged) {
      set.faq = nextFaq;
      changed = true;
    }
  }

  if (doc.featured != null && typeof doc.featured === "object") {
    const raw = doc.featured as Record<string, unknown>;
    const hasLegacyKey = "featuredDescription" in raw && typeof raw.featuredDescription === "string";
    const descIsString = typeof raw.description === "string";

    if (hasLegacyKey || descIsString) {
      const next: Record<string, unknown> = { ...raw };
      delete next.featuredDescription;

      if (hasLegacyKey) {
        const blocks = textToBlocks(raw.featuredDescription as string);
        next.description = blocks ?? [];
        unset.push("featured.featuredDescription");
        changed = true;
        set.featured = next;
      } else if (descIsString) {
        const blocks = textToBlocks(raw.description as string);
        if (blocks !== undefined) {
          next.description = blocks;
          changed = true;
          set.featured = next;
        }
      }
    }
  }

  if (!changed) return null;
  return { set, unset };
}
