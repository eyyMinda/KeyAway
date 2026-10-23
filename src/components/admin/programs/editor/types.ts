import type { ProgramForm } from "./programForm";

export interface EditorLookups {
  vendors: { _id: string; name: string }[];
  categories: { _id: string; title: string }[];
}

export interface TabProps {
  form: ProgramForm;
  update: (patch: Partial<ProgramForm>) => void;
  /** First validation message for an exact field path (e.g. `title`, `faq.0.question`). */
  errorOf: (field: string) => string | undefined;
}

export interface ImageTabProps extends TabProps {
  openLibrary: (onPick: (assetId: string) => void) => void;
}
