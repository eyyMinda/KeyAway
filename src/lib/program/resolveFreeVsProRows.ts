import type { FreeVsProRow, Program } from "@/src/types/program";

function validRows(rows: FreeVsProRow[] | null | undefined): FreeVsProRow[] {
  return (rows ?? []).filter(r => r.feature?.trim());
}

/** Program-specific rows win; otherwise inherit from the linked vendor's defaults. */
export function resolveFreeVsProRows(
  program: Pick<Program, "freeVsProComparison" | "vendor">
): FreeVsProRow[] {
  const programRows = validRows(program.freeVsProComparison);
  if (programRows.length > 0) return programRows;
  return validRows(program.vendor?.freeVsProDefaults);
}
