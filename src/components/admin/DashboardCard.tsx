import Link from "next/link";

export interface DashboardCardProps {
  href: string;
  title: string;
  subtitle: string;
  icon: string;
  /** Tailwind color for icon bg and hover border, e.g. "blue", "green" */
  color?: "blue" | "green" | "purple" | "orange" | "yellow" | "pink";
}

const colorClasses: Record<string, { bg: string; hover: string }> = {
  blue: { bg: "bg-blue-100 dark:bg-blue-500/15 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/25", hover: "group-hover:border-blue-300 dark:group-hover:border-blue-500/40" },
  green: { bg: "bg-green-100 dark:bg-green-500/15 group-hover:bg-green-200 dark:group-hover:bg-green-500/25", hover: "group-hover:border-green-300 dark:group-hover:border-green-500/40" },
  purple: { bg: "bg-purple-100 dark:bg-purple-500/15 group-hover:bg-purple-200 dark:group-hover:bg-purple-500/25", hover: "group-hover:border-purple-300 dark:group-hover:border-purple-500/40" },
  orange: { bg: "bg-orange-100 dark:bg-orange-500/15 group-hover:bg-orange-200 dark:group-hover:bg-orange-500/25", hover: "group-hover:border-orange-300 dark:group-hover:border-orange-500/40" },
  yellow: { bg: "bg-yellow-100 dark:bg-yellow-500/15 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-500/25", hover: "group-hover:border-yellow-300 dark:group-hover:border-yellow-500/40" },
  pink: { bg: "bg-pink-100 dark:bg-pink-500/15 group-hover:bg-pink-200 dark:group-hover:bg-pink-500/25", hover: "group-hover:border-pink-300 dark:group-hover:border-pink-500/40" }
};

export default function DashboardCard({ href, title, subtitle, icon, color = "blue" }: DashboardCardProps) {
  const { bg, hover } = colorClasses[color] ?? colorClasses.blue;
  return (
    <Link href={href} className="group">
      <div
        className={`bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all duration-200 ${hover}`}>
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center transition-colors`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
