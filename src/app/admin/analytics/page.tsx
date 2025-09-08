import { trackingEventsQuery } from "@/src/lib/queries";
import { client } from "@/src/sanity/lib/client";

type EventDoc = {
  _id: string;
  event: string;
  programSlug?: string;
  social?: string;
  createdAt: string;
};

export const revalidate = 60; // refresh every minute

export default async function AnalyticsPage() {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();

  const events: EventDoc[] = await client.fetch(trackingEventsQuery, { since });

  // Aggregate in Node
  const totals = new Map<string, number>();
  const byProgram = new Map<string, number>();
  const bySocial = new Map<string, number>();

  for (const e of events) {
    totals.set(e.event, (totals.get(e.event) || 0) + 1);
    if (e.programSlug) byProgram.set(e.programSlug, (byProgram.get(e.programSlug) || 0) + 1);
    if (e.social) bySocial.set(e.social, (bySocial.get(e.social) || 0) + 1);
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold">Analytics (Last 30 Days)</h1>

      <section>
        <h2 className="text-lg font-semibold mb-2">Totals by Event</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from(totals).map(([name, count]) => (
            <div key={name} className="rounded-xl border p-4">
              <div className="text-sm text-gray-500">{name}</div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">By Program</h2>
        <table className="w-full text-sm border">
          <tbody>
            {Array.from(byProgram).map(([slug, count]) => (
              <tr key={slug} className="border-t">
                <td className="p-2 font-mono">{slug}</td>
                <td className="p-2 text-right">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">By Social</h2>
        <table className="w-full text-sm border">
          <tbody>
            {Array.from(bySocial).map(([name, count]) => (
              <tr key={name} className="border-t">
                <td className="p-2">{name}</td>
                <td className="p-2 text-right">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
