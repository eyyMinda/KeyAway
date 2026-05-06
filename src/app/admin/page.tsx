import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import DashboardCard from "@/src/components/admin/DashboardCard";
import CronStatusCard from "@/src/components/admin/CronStatusCard";
import QuickOverviewStats from "@/src/components/admin/QuickOverviewStats";
import WelcomeHeader from "@/src/components/admin/WelcomeHeader";
import IndexNowSubmitCard from "@/src/components/admin/IndexNowSubmitCard";

export default function AdminHomePage() {
  return (
    <ProtectedAdminLayout headerContent={<WelcomeHeader />}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <DashboardCard
          href="/admin/analytics"
          title="Analytics"
          subtitle="View user behavior and engagement metrics"
          icon="📊"
          color="blue"
        />
        <DashboardCard
          href="/admin/programs"
          title="Programs"
          subtitle="Manage CD key programs and content"
          icon="🎮"
          color="green"
        />
        <DashboardCard
          href="/admin/events"
          title="Events"
          subtitle="Track and analyze site analytics"
          icon="📈"
          color="purple"
        />
        <DashboardCard
          href="/admin/key-reports"
          title="Key Reports"
          subtitle="Manage all CD key reports (working, expired, limit reached)"
          icon="🔄"
          color="orange"
        />
        <DashboardCard
          href="/admin/key-suggestions"
          title="Key Suggestions"
          subtitle="Review user-submitted CD keys"
          icon="🔑"
          color="yellow"
        />
        <DashboardCard
          href="/admin/messages"
          title="Messages"
          subtitle="View and respond to contact messages"
          icon="📬"
          color="pink"
        />
      </div>

      {/* Quick Overview */}
      <div className="mt-8 md:mt-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 md:mb-6">Quick Overview</h3>
        <QuickOverviewStats />
      </div>

      {/* Cron Status */}
      <div className="mt-8 md:mt-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 md:mb-6">System</h3>
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <CronStatusCard />
        </div>
      </div>

      <div className="mt-8 md:mt-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 md:mb-6">SEO</h3>
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <IndexNowSubmitCard />
        </div>
      </div>

    </ProtectedAdminLayout>
  );
}
