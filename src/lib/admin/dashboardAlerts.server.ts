/**
 * @fileoverview Everything the admin dashboard's first fold shows: one list of alerts (broken jobs, keys reported
 * broken, new messages, usage nearing limits…) each linking to where it can be handled, plus count tiles. Each source
 * fails on its own, so one unavailable source never blanks the dashboard.
 */
import { unstable_cache } from "next/cache";
import { client } from "@/src/sanity/lib/client";
import { loadAdminAttention, type AdminAttention } from "@/src/lib/admin/attention.server";
import { getInboxCounts, type InboxCounts } from "@/src/lib/admin/inboxCounts.server";
import { getCachedKeyReview } from "@/src/lib/admin/keyReview.server";
import type { KeyReview } from "@/src/lib/admin/keyReview";
import { getCachedAnalyticsDbUsage } from "@/src/lib/admin/analyticsDbUsage.server";
import { getCachedUsageInsights, type UsageInsights } from "@/src/lib/admin/usageInsights.server";
import { describeUserAgent } from "@/src/lib/analytics/describeUserAgent";
import { STAFF_COMMENT_AUTHOR_NAME, STAFF_COMMENT_AUTHOR_ROLE } from "@/src/lib/program/staffCommentIdentity";
import { DAY_MS, WEEK_MS } from "@/src/lib/time";

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertCategory = "system" | "keys" | "inbox" | "content" | "usage";

/** Alerts that open a dialog on the dashboard instead of navigating. */
export type DashboardAlertAction = "key-review-keys" | "key-review-reports";

export type DashboardAlert = {
  id: string;
  action?: DashboardAlertAction;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  detail?: string;
  href: string;
};

export type DashboardTile = {
  id: string;
  label: string;
  value: number;
  hint: string;
  href: string;
  attention: boolean;
};

/** Program versions for the inbox card: waiting for review, and applied from trusted sources this week. */
export type DashboardVersions = Pick<AdminAttention, "versionsWaiting" | "autoApplied" | "versionChecksFailed">;

export type DashboardAlerts = {
  alerts: DashboardAlert[];
  tiles: DashboardTile[];
  versions: DashboardVersions | null;
  partial: boolean;
};

/** Supabase free plan egress per billing period. */
const EGRESS_QUOTA_BYTES = 5 * 1024 ** 3;
/** Query stats younger than this are too short to project a month from. */
const MIN_PROJECTION_DAYS = 2;
const STATUS_LABELS: Record<string, string> = {
  new: "new",
  active: "active",
  expired: "expired",
  limit: "limit reached"
};
const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

const USAGE_HREF = "/admin#usage";
const SYSTEM_HREF = "/admin#system";
const TRAFFIC_HREF = "/admin#traffic-quality";
const VERSIONS_HREF = "/admin/programs?view=versions";

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
/** "A ×2, B and 3 more": repeated names (several keys of one program) are grouped. */
const names = (items: string[], max = 3) => {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  const unique = [...counts].map(([name, n]) => (n > 1 ? `${name} ×${n}` : name));
  return unique.slice(0, max).join(", ") + (unique.length > max ? ` and ${unique.length - max} more` : "");
};

type CommentItem = { authorName?: string; authorRole?: string; createdAt?: string };

/** Visitor comments and replies from the last week: worth a look, though most need no reply. */
const getRecentComments = unstable_cache(
  async (): Promise<number> => {
    // One row per program; comments and replies are flattened here (GROQ keeps them grouped per document).
    const programs = await client.fetch<Array<{ comments: CommentItem[] | null; replies: CommentItem[] | null }>>(
      `*[_type == "program" && count(programComments) > 0]{
        "comments": programComments[]{ authorName, authorRole, createdAt },
        "replies": programComments[].replies[]{ authorName, authorRole, createdAt }
      }`,
      {},
      { useCdn: false }
    );
    const items = programs.flatMap(p => [...(p.comments ?? []), ...(p.replies ?? [])]).filter(Boolean);
    const since = Date.now() - WEEK_MS;
    const isStaff = (a: CommentItem) =>
      a.authorName === STAFF_COMMENT_AUTHOR_NAME && a.authorRole === STAFF_COMMENT_AUTHOR_ROLE;
    return items.filter(c => !isStaff(c) && c.createdAt && Date.parse(c.createdAt) >= since).length;
  },
  ["admin-recent-comments"],
  { revalidate: 60 }
);

const settle = <T>(p: Promise<T>) =>
  p.then(
    value => value,
    () => null as T | null
  );

function systemAlerts(attention: AdminAttention): DashboardAlert[] {
  const alerts: DashboardAlert[] = attention.jobs.map(job => ({
    id: `job-${job.job}`,
    severity: job.problem === "failed" ? "critical" : "warning",
    category: "system",
    title:
      job.problem === "failed"
        ? `${job.label} failed`
        : job.problem === "overdue"
          ? `${job.label} has not run on schedule`
          : `${job.label} has never run automatically`,
    detail: job.details,
    href: SYSTEM_HREF
  }));
  if (attention.versionChecksFailed) {
    alerts.push({
      id: "version-checks",
      severity: "warning",
      category: "system",
      title: `${plural(attention.versionChecksFailed, "version check")} failing`,
      detail: "The program's version source could not be read.",
      href: VERSIONS_HREF
    });
  }
  return alerts;
}

function keyAlerts(review: KeyReview): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  if (review.keys.length) {
    const sure = review.keys.filter(k => k.confidence === "high").length;
    alerts.push({
      id: "key-status",
      action: "key-review-keys",
      severity: "warning",
      category: "keys",
      title: `${plural(review.keys.length, "key")} probably need a status update`,
      detail:
        (sure ? `${sure} with high confidence · ` : "") +
        names(review.keys.map(k => `${k.programTitle} → ${STATUS_LABELS[k.suggested]}`)),
      href: "/admin/key-reports"
    });
  }
  if (review.reports.length) {
    alerts.push({
      id: "key-doubtful",
      action: "key-review-reports",
      severity: "info",
      category: "keys",
      title: `${plural(review.reports.length, "key report")} look doubtful`,
      detail: "Spammers, mass reporting, or reports contradicted by many others.",
      href: "/admin/key-reports"
    });
  }
  return alerts;
}

function inboxAlerts(inbox: InboxCounts, comments: number | null, attention: AdminAttention | null): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  if (inbox.newMessages)
    alerts.push({
      id: "messages",
      severity: "info",
      category: "inbox",
      title: plural(inbox.newMessages, "new message"),
      href: "/admin/messages"
    });
  if (inbox.newSuggestions)
    alerts.push({
      id: "suggestions",
      severity: "info",
      category: "inbox",
      title: plural(inbox.newSuggestions, "new key suggestion"),
      href: "/admin/key-suggestions"
    });
  if (comments)
    alerts.push({
      id: "comments",
      severity: "info",
      category: "inbox",
      title: `${plural(comments, "new comment")} this week`,
      href: "/admin/comments"
    });
  if (attention?.versionsWaiting.length)
    alerts.push({
      id: "versions",
      severity: "info",
      category: "content",
      title: `${plural(attention.versionsWaiting.length, "new program version")} to review`,
      detail: names(attention.versionsWaiting.map(v => `${v.title} ${v.found}`)),
      href: VERSIONS_HREF
    });
  if (inbox.newGiveawayFinds)
    alerts.push({
      id: "finds",
      severity: "info",
      category: "content",
      title: plural(inbox.newGiveawayFinds, "new giveaway find"),
      href: "/admin/giveaway-finds"
    });
  return alerts;
}

function usageAlerts(
  dbSize: { sizeBytes: number; limitBytes: number } | null,
  insights: UsageInsights | null
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  if (dbSize) {
    const ratio = dbSize.sizeBytes / dbSize.limitBytes;
    if (ratio >= 0.7)
      alerts.push({
        id: "db-size",
        severity: ratio >= 0.85 ? "critical" : "warning",
        category: "usage",
        title: `Database at ${Math.round(ratio * 100)}% of its ${Math.round(dbSize.limitBytes / 1024 ** 2)} MB limit`,
        detail: "Run `vacuum full` on the analytics tables, or look at what is growing.",
        href: USAGE_HREF
      });
  }
  const traffic = insights?.traffic;
  if (traffic?.available && traffic.since) {
    const days = (Date.now() - Date.parse(traffic.since)) / DAY_MS;
    if (days >= MIN_PROJECTION_DAYS) {
      const ratio = ((traffic.estBytes / days) * 30) / EGRESS_QUOTA_BYTES;
      if (ratio >= 0.7)
        alerts.push({
          id: "egress",
          severity: "warning", // An estimate from query statistics, so never critical on its own.
          category: "usage",
          title: `Database egress trending to ~${Math.round(ratio * 100)}% of the 5 GB monthly quota`,
          detail:
            "Estimated from query statistics since their last reset; check the top queries, or reset the counters after a fix.",
          href: USAGE_HREF
        });
    }
  }
  for (const agent of insights?.userAgents ?? []) {
    const perVisitor = agent.visitors ? agent.sessions / agent.visitors : 0;
    if (!agent.isBot && agent.sessions >= 300 && perVisitor >= 4 && agent.homeOnly / agent.sessions >= 0.8) {
      alerts.push({
        id: `bot-${agent.id}`,
        severity: "info",
        category: "usage",
        title: `Possible bot traffic: ${describeUserAgent(agent.ua)}`,
        detail: `${agent.sessions.toLocaleString()} visits, ${perVisitor.toFixed(1)} per visitor, ${Math.round((agent.homeOnly / agent.sessions) * 100)}% homepage only.`,
        href: TRAFFIC_HREF
      });
    }
  }
  return alerts;
}

export async function loadDashboardAlerts(): Promise<DashboardAlerts> {
  const [attention, inbox, review, comments, dbSize, insights] = await Promise.all([
    settle(loadAdminAttention()),
    settle(getInboxCounts()),
    settle(getCachedKeyReview()),
    settle(getRecentComments()),
    settle(getCachedAnalyticsDbUsage()),
    settle(getCachedUsageInsights())
  ]);

  const alerts = [
    ...(attention ? systemAlerts(attention) : []),
    ...(review ? keyAlerts(review) : []),
    ...(inbox ? inboxAlerts(inbox, comments, attention) : []),
    ...usageAlerts(dbSize, insights)
  ].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const tile = (
    id: string,
    label: string,
    value: number | null | undefined,
    hint: string,
    href: string
  ): DashboardTile => ({
    id,
    label,
    value: value ?? 0,
    hint,
    href,
    attention: (value ?? 0) > 0
  });

  return {
    alerts,
    tiles: [
      tile("messages", "Messages", inbox?.newMessages, "new", "/admin/messages"),
      tile("suggestions", "Key suggestions", inbox?.newSuggestions, "new", "/admin/key-suggestions"),
      tile("comments", "Comments", comments, "new this week", "/admin/comments"),
      tile("keys", "Key reports", review?.keys.length, "keys to update", "/admin/key-reports"),
      tile("finds", "Giveaway finds", inbox?.newGiveawayFinds, "new", "/admin/giveaway-finds")
    ],
    versions: attention
      ? {
          versionsWaiting: attention.versionsWaiting,
          autoApplied: attention.autoApplied,
          versionChecksFailed: attention.versionChecksFailed
        }
      : null,
    partial: [attention, inbox, review, comments, dbSize, insights].some(v => v === null)
  };
}
