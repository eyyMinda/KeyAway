import { NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { keyReportsQuery } from "@/src/lib/queries";
import type { KeyReportNotificationItem } from "@/src/types/admin";

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
const MAX_ITEMS = 20;

type KeyReportEventType = "report_key_working" | "report_key_expired" | "report_key_limit_reached";

interface KeyReportEvent {
  eventType: string;
  programSlug: string;
  keyHash: string;
  keyIdentifier: string;
  createdAt: string;
}

interface Group {
  programSlug: string;
  keyIdentifier: string;
  working: number;
  expired: number;
  limit_reached: number;
}

/** Keys that need attention: at least one negative report in last 60 days. */
export async function GET() {
  try {
    const since = new Date(Date.now() - SIXTY_DAYS_MS).toISOString();

    const [events, programs] = await Promise.all([
      client.fetch<KeyReportEvent[]>(keyReportsQuery, { since }),
      client.fetch<Array<{ slug: string; title: string }>>(`*[_type == "program"]{ "slug": slug.current, title }`)
    ]);

    const programTitleBySlug = new Map<string, string>();
    for (const p of programs) {
      if (p.slug) programTitleBySlug.set(p.slug, p.title ?? p.slug);
    }

    const groups = new Map<string, Group>();

    for (const report of events) {
      const programSlug = (report.programSlug ?? "").trim() || "unknown";
      const keyHash = (report.keyHash ?? "").trim() || "unknown";
      const keyIdentifier = (report.keyIdentifier ?? "").trim() || "unknown";
      const groupKey = `${programSlug}:${keyHash}`;
      const eventType = report.eventType as KeyReportEventType;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          programSlug,
          keyIdentifier,
          working: 0,
          expired: 0,
          limit_reached: 0
        });
      }
      const g = groups.get(groupKey)!;
      if (eventType === "report_key_working") g.working++;
      else if (eventType === "report_key_expired") g.expired++;
      else if (eventType === "report_key_limit_reached") g.limit_reached++;
    }

    const negativeFiltered: Array<Group & { negativeCount: number; total: number }> = [];
    for (const g of groups.values()) {
      const negativeCount = g.expired + g.limit_reached;
      if (negativeCount < 1) continue;
      const total = g.working + g.expired + g.limit_reached;
      negativeFiltered.push({ ...g, negativeCount, total });
    }

    negativeFiltered.sort((a, b) => {
      if (b.negativeCount !== a.negativeCount) return b.negativeCount - a.negativeCount;
      const ratioA = a.total > 0 ? a.working / a.total : 0;
      const ratioB = b.total > 0 ? b.working / b.total : 0;
      return ratioA - ratioB;
    });

    const items: KeyReportNotificationItem[] = negativeFiltered.slice(0, MAX_ITEMS).map(g => {
      const total = g.working + g.expired + g.limit_reached;
      const positiveCount = g.working;
      const ratioLabel = total > 0 ? `${g.working}/${total} positive (60d)` : "0 positive (60d)";
      return {
        programSlug: g.programSlug,
        programTitle: programTitleBySlug.get(g.programSlug) ?? g.programSlug,
        keyIdentifier: g.keyIdentifier,
        negativeCount: g.negativeCount,
        positiveCount,
        working: g.working,
        expired: g.expired,
        limit_reached: g.limit_reached,
        ratioLabel,
        link: `/admin/key-reports?program=${encodeURIComponent(g.programSlug)}`
      };
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching key-report notifications:", error);
    return NextResponse.json([], { status: 500 });
  }
}
