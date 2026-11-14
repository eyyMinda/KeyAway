/**
 * @fileoverview "Needs attention" for the admin dashboard: cron jobs that failed or missed their schedule, and program
 * versions waiting for review or applied automatically from a trusted source. One Sanity query.
 */
import { client } from "@/src/sanity/lib/client";
import { isNewerVersion } from "@/src/lib/versions/compareVersions";
import { HOUR_MS, WEEK_MS } from "@/src/lib/time";
import type { CronJob } from "@/src/lib/api/cronUtils";

/** How often each job runs (vercel.json), plus slack before a missing run counts as overdue. */
const JOB_SCHEDULES: Record<CronJob, { label: string; everyMs: number }> = {
  "sync-program-stats": { label: "Program Stats", everyMs: 6 * HOUR_MS },
  "update-expired-keys": { label: "Update Expired Keys", everyMs: 24 * HOUR_MS },
  "prune-cron-runs": { label: "Prune & Analytics Rollup", everyMs: 24 * HOUR_MS },
  "discover-giveaways": { label: "Discover Giveaways", everyMs: 24 * HOUR_MS },
  "check-versions": { label: "Check Versions", everyMs: 24 * HOUR_MS }
};
const OVERDUE_SLACK_MS = 3 * HOUR_MS;

export type JobProblem = {
  job: CronJob;
  label: string;
  problem: "failed" | "overdue" | "never";
  at?: string;
  details?: string;
};

export type VersionUpdate = { id: string; title: string; current?: string; found: string; at?: string };

export type AdminAttention = {
  jobs: JobProblem[];
  versionsWaiting: VersionUpdate[];
  autoApplied: VersionUpdate[];
  versionChecksFailed: number;
};

type Run = { status: string; ranAt: string; details?: string };
type ProgramVersionRow = {
  _id: string;
  title: string;
  latestOfficialVersion?: string;
  autoApply?: boolean;
  versionStatus?: {
    latestVersion?: string;
    error?: string;
    changedAt?: string;
    autoAppliedVersion?: string;
    autoAppliedAt?: string;
  };
};

const jobs = Object.keys(JOB_SCHEDULES) as CronJob[];
const runFields = "{ status, ranAt, details }";
const latestRunsQuery = `{
  ${jobs
    .map(
      job => `"${job}": {
        "last": *[_type == "cronRun" && job == "${job}"] | order(ranAt desc)[0]${runFields},
        "lastAuto": *[_type == "cronRun" && job == "${job}" && source in ["bearer", "vercel_cron"]] | order(ranAt desc)[0]${runFields}
      }`
    )
    .join(",\n")},
  "programs": *[_type == "program" && defined(versionCheck.source) && !(_id in path("drafts.**"))]{
    _id, title, latestOfficialVersion, "autoApply": versionCheck.autoApply, versionStatus
  }
}`;

export async function loadAdminAttention(): Promise<AdminAttention> {
  const data = await client.fetch<Record<string, unknown>>(latestRunsQuery, {}, { cache: "no-store", useCdn: false });
  const now = Date.now();

  const jobProblems: JobProblem[] = [];
  for (const job of jobs) {
    const { label, everyMs } = JOB_SCHEDULES[job];
    const { last, lastAuto } = (data[job] ?? {}) as { last?: Run | null; lastAuto?: Run | null };
    if (last?.status === "error")
      jobProblems.push({ job, label, problem: "failed", at: last.ranAt, details: last.details });
    else if (!lastAuto) jobProblems.push({ job, label, problem: "never" });
    else if (now - Date.parse(lastAuto.ranAt) > everyMs + OVERDUE_SLACK_MS)
      jobProblems.push({ job, label, problem: "overdue", at: lastAuto.ranAt });
  }

  const programs = (data.programs ?? []) as ProgramVersionRow[];
  const weekAgo = now - WEEK_MS;
  return {
    jobs: jobProblems,
    versionsWaiting: programs
      .filter(p => isNewerVersion(p.versionStatus?.latestVersion, p.latestOfficialVersion))
      .map(p => ({
        id: p._id,
        title: p.title,
        current: p.latestOfficialVersion,
        found: p.versionStatus!.latestVersion!,
        at: p.versionStatus?.changedAt
      })),
    autoApplied: programs
      .filter(p => p.versionStatus?.autoAppliedAt && Date.parse(p.versionStatus.autoAppliedAt) >= weekAgo)
      .map(p => ({
        id: p._id,
        title: p.title,
        found: p.versionStatus!.autoAppliedVersion ?? "?",
        at: p.versionStatus!.autoAppliedAt
      })),
    versionChecksFailed: programs.filter(p => p.versionStatus?.error).length
  };
}
