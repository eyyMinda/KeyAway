import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { keyReportsQuery } from "@/src/lib/sanity/queries";
import type { KeyReportNotificationItem } from "@/src/types/admin";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { getKeyData } from "@/src/lib/keyHashing";
import type { CDKey, ProgramFlow } from "@/src/types/program";
import { normalizeProgramFlow } from "@/src/lib/program/activationEntry";

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
const MAX_ITEMS = 20;

type KeyReportEventType = "report_key_working" | "report_key_expired" | "report_key_limit_reached";

interface KeyReportEvent {
  eventType: string;
  programSlug: string;
  key?: string;
  label?: string;
  _createdAt?: string;
  createdAt?: string;
}

interface Group {
  programSlug: string;
  storageKey: string;
  label: string;
  working: number;
  expired: number;
  limit_reached: number;
  lastReportAt: string;
  lastEventType?: KeyReportEventType;
}

interface ProgramWithKeys {
  slug: string;
  title: string;
  programFlow?: string;
  cdKeys?: CDKey[];
}

function reportStorageKey(r: KeyReportEvent): string {
  const k = (r.key ?? "").trim();
  return k || "unknown";
}

function reportLabel(r: KeyReportEvent): string {
  const l = (r.label ?? "").trim();
  return l || "—";
}

/** GET /api/v1/admin/key-report-notifications - Keys needing attention (negative reports, 60d) */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const since = new Date(Date.now() - SIXTY_DAYS_MS).toISOString();

    const [events, programs] = await Promise.all([
      client.fetch<KeyReportEvent[]>(keyReportsQuery, { since }),
      client.fetch<ProgramWithKeys[]>(
        `*[_type == "program"]{ "slug": slug.current, title, "programFlow": coalesce(programFlow, "cd_key"), cdKeys }`
      )
    ]);

    const programTitleBySlug = new Map<string, string>();
    const resolvedKeys = new Set<string>();
    for (const p of programs ?? []) {
      if (p.slug) programTitleBySlug.set(p.slug, p.title ?? p.slug);
      const flow = normalizeProgramFlow(p.programFlow) as ProgramFlow;
      for (const k of p.cdKeys ?? []) {
        const kd = getKeyData({ ...(k as CDKey), programFlow: flow }, flow);
        if (p.slug && kd?.hash && (k.status === "expired" || k.status === "limit")) {
          resolvedKeys.add(`${p.slug}:${kd.hash}`);
        }
      }
    }

    const groups = new Map<string, Group>();

    for (const report of events ?? []) {
      const programSlug = (report.programSlug ?? "").trim() || "unknown";
      const storageKey = reportStorageKey(report);
      const label = reportLabel(report);
      if (storageKey === "unknown") continue;
      const groupKey = `${programSlug}:${storageKey}`;
      const eventType = report.eventType as KeyReportEventType;

      const reportAt = report._createdAt ?? report.createdAt ?? "";
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          programSlug,
          storageKey,
          label,
          working: 0,
          expired: 0,
          limit_reached: 0,
          lastReportAt: reportAt,
          lastEventType: eventType
        });
      }
      const g = groups.get(groupKey)!;
      if (reportAt && reportAt >= g.lastReportAt) {
        g.lastReportAt = reportAt;
        g.lastEventType = eventType;
      }
      if (eventType === "report_key_working") g.working++;
      else if (eventType === "report_key_expired") g.expired++;
      else if (eventType === "report_key_limit_reached") g.limit_reached++;
    }

    const negativeFiltered: Array<Group & { negativeCount: number; total: number }> = [];
    for (const g of groups.values()) {
      const negativeCount = g.expired + g.limit_reached;
      if (negativeCount < 1) continue;
      if (g.working > 0 && g.lastEventType === "report_key_working") continue;
      if (resolvedKeys.has(`${g.programSlug}:${g.storageKey}`)) continue;
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
      const ratioLabel = total > 0 ? `${g.working}/${total} positive` : "0 positive";
      return {
        programSlug: g.programSlug,
        programTitle: programTitleBySlug.get(g.programSlug) ?? g.programSlug,
        label: g.label,
        negativeCount: g.negativeCount,
        positiveCount: g.working,
        working: g.working,
        expired: g.expired,
        limit_reached: g.limit_reached,
        ratioLabel,
        lastReportAt: g.lastReportAt,
        link: `/admin/key-reports?program=${encodeURIComponent(g.programSlug)}`
      };
    });

    return NextResponse.json({ data: items, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/key-report-notifications]", err);
    return Errors.internal();
  }
}
