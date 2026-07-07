import Link from "next/link";
import type { Program } from "@/src/types/program";
import { resolveFreeVsProRows } from "@/src/lib/program/resolveFreeVsProRows";

type FreeVsProComparisonProps = {
  program: Program;
};

export default function FreeVsProComparison({ program }: FreeVsProComparisonProps) {
  const rows = resolveFreeVsProRows(program);
  if (rows.length === 0) return null;

  const affiliateUrl = program.affiliatePro?.affiliateProUrl?.trim();
  const vendorName = program.vendor?.name;

  return (
    <section className="mx-auto max-w-360 px-4 pb-6 pt-2 sm:px-6 sm:pb-8 lg:px-8" aria-labelledby="free-vs-pro-heading">
      <div className="overflow-hidden rounded-sm border border-[#2a475e] bg-[#16202d]">
        <div className="border-b border-[#2a475e] px-4 py-4 sm:px-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#66c0f4]">Free vs Official PRO</p>
          <h2 id="free-vs-pro-heading" className="text-lg font-bold text-white sm:text-xl">
            What you get with{vendorName ? ` ${vendorName} PRO` : " PRO"}
          </h2>
          <p className="mt-2 text-sm text-neutral-100">
            The free edition covers the basics. Official PRO unlocks the full feature set, with updates and support.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#2a475e] bg-[#1b2838]">
                <th scope="col" className="px-4 py-3 font-semibold text-[#c6d4df] sm:px-6">
                  Feature
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-[#66c0f4] sm:px-6">
                  Free
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-[#5ba32b] sm:px-6">
                  Official PRO
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.feature}-${i}`} className={i % 2 === 0 ? "bg-[#16202d]" : "bg-[#1b2838]/60"}>
                  <th scope="row" className="px-4 py-3 font-medium text-[#c6d4df] sm:px-6">
                    {row.feature}
                  </th>
                  <td className="px-4 py-3 text-neutral-100 sm:px-6">{row.free?.trim() || "—"}</td>
                  <td className="px-4 py-3 font-medium text-[#c6d4df] sm:px-6">{row.pro?.trim() || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {affiliateUrl ? (
          <div className="border-t border-[#2a475e] bg-[#1b2838]/80 px-4 py-3 sm:px-6">
            <p className="text-xs leading-relaxed text-[#8f98a0] sm:text-sm">
              <span className="font-semibold text-[#c6d4df]">Pro tip:</span> want every feature above, permanently, with
              updates and support? Grab the official PRO license via the button below.{" "}
              <Link href="/affiliate-disclosure" className="text-[#66c0f4] underline hover:text-white">
                Affiliate disclosure
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
