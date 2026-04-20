import type { Program } from "@/src/types";

/** Hero / headings: `Title` or `Title 1.2` when vendor version is set (no stray space or “null”). */
export function formatProgramDisplayTitle(program: Program): string {
  const v = program.latestOfficialVersion?.trim();
  return v ? `${program.title} ${v}` : program.title;
}
