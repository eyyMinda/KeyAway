import Breadcrumbs from "@/src/components/layout/Breadcrumbs";
import { buildProgramBreadcrumbItems } from "@/src/lib/seo/breadcrumbs";
import type { Program } from "@/src/types/program";

type ProgramBreadcrumbsProps = {
  program: Pick<Program, "title" | "vendor">;
  className?: string;
};

export default function ProgramBreadcrumbs({ program, className }: ProgramBreadcrumbsProps) {
  return <Breadcrumbs className={className} items={buildProgramBreadcrumbItems(program)} />;
}
