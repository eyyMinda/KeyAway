import type { FreeVsProRow, Program } from "@/src/types/program";

/** Valid rows only (a non-empty feature label). */
export function resolveFreeVsProRows(program: Pick<Program, "freeVsProComparison">): FreeVsProRow[] {
  return (program.freeVsProComparison ?? []).filter(r => r.feature?.trim());
}
