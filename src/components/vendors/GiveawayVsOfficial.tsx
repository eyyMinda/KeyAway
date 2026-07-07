import type { GiveawayComparisonRow } from "@/src/types/program";

type GiveawayVsOfficialProps = {
  rows?: GiveawayComparisonRow[] | null;
  vendorName: string;
};

/**
 * Vendor-hub explainer: how a community giveaway key compares to buying the
 * official PRO license. A giveaway key unlocks the real PRO version — the
 * honest trade-off is longevity/reliability, not features.
 */
export default function GiveawayVsOfficial({ rows, vendorName }: GiveawayVsOfficialProps) {
  const validRows = (rows ?? []).filter(r => r.feature?.trim());
  if (validRows.length === 0) return null;

  return (
    <section
      className="mx-auto w-full max-w-360 px-4 py-8 sm:px-6 lg:px-8"
      aria-labelledby="giveaway-vs-official-heading">
      <div className="overflow-hidden rounded-sm border border-[#2a475e] bg-[#16202d]">
        <div className="border-b border-[#2a475e] px-4 py-4 sm:px-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#66c0f4]">
            Giveaway key vs official PRO
          </p>
          <h2 id="giveaway-vs-official-heading" className="text-lg font-bold text-white sm:text-xl">
            Using a {vendorName} giveaway key vs buying official
          </h2>
          <p className="mt-2 text-sm text-neutral-100">
            A giveaway key unlocks the <span className="font-semibold text-white">full PRO version</span> — for free,
            while it lasts. Buying the official license is what keeps it running long-term. Here&apos;s the honest
            trade-off.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#2a475e] bg-[#1b2838]">
                <th scope="col" className="px-4 py-3 font-semibold text-[#c6d4df] sm:px-6">
                  &nbsp;
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-[#66c0f4] sm:px-6">
                  Giveaway key
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-[#5ba32b] sm:px-6">
                  Official PRO
                </th>
              </tr>
            </thead>
            <tbody>
              {validRows.map((row, i) => (
                <tr
                  key={`${row.feature}-${i}`}
                  className={i % 2 === 0 ? "bg-[#16202d]" : "bg-[#1b2838]/60"}>
                  <th scope="row" className="px-4 py-3 font-medium text-[#c6d4df] sm:px-6">
                    {row.feature}
                  </th>
                  <td className="px-4 py-3 text-neutral-100 sm:px-6">{row.giveaway?.trim() || "—"}</td>
                  <td className="px-4 py-3 font-medium text-[#c6d4df] sm:px-6">{row.officialPro?.trim() || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
