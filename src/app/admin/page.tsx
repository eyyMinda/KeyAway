import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import CronStatusCard from "@/src/components/admin/CronStatusCard";
import DatasetDocCounts from "@/src/components/admin/DatasetDocCounts";
import AnalyticsDbUsage from "@/src/components/admin/AnalyticsDbUsage";
import WelcomeHeader from "@/src/components/admin/WelcomeHeader";
import IndexNowSubmitCard from "@/src/components/admin/IndexNowSubmitCard";
import GiveawayPickerCard from "@/src/components/admin/GiveawayPickerCard";
import DashboardAlerts from "@/src/components/admin/DashboardAlerts";
import UsageInsights from "@/src/components/admin/UsageInsights";

function SectionHeading({ id, title, subtitle }: { id: string; title: string; subtitle: string }) {
  return (
    <div id={id} className="mb-4 scroll-mt-24 md:mb-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  );
}

/** Admin home: what needs attention first, then usage, seasonal tools, and scheduled jobs at the bottom. */
export default function AdminHomePage() {
  return (
    <ProtectedAdminLayout headerContent={<WelcomeHeader />}>
      <DashboardAlerts />

      <section className="mt-10 md:mt-14">
        <SectionHeading id="usage" title="Usage" subtitle="Database size and traffic against the free plan limits." />
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <AnalyticsDbUsage />
          <DatasetDocCounts />
        </div>
        <div className="mt-6">
          <UsageInsights />
        </div>
      </section>

      <section className="mt-10 md:mt-14">
        <SectionHeading id="seasonal" title="Seasonal" subtitle="Giveaways and search engine submissions." />
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <GiveawayPickerCard />
          <IndexNowSubmitCard />
        </div>
      </section>

      <section className="mt-10 md:mt-14">
        <SectionHeading id="system" title="System" subtitle="Scheduled jobs: last runs and recent history." />
        <CronStatusCard />
      </section>
    </ProtectedAdminLayout>
  );
}
