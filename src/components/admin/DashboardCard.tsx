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
  blue: { bg: "bg-blue-100 group-hover:bg-blue-200", hover: "group-hover:border-blue-300" },
  green: { bg: "bg-green-100 group-hover:bg-green-200", hover: "group-hover:border-green-300" },
  purple: { bg: "bg-purple-100 group-hover:bg-purple-200", hover: "group-hover:border-purple-300" },
  orange: { bg: "bg-orange-100 group-hover:bg-orange-200", hover: "group-hover:border-orange-300" },
  yellow: { bg: "bg-yellow-100 group-hover:bg-yellow-200", hover: "group-hover:border-yellow-300" },
  pink: { bg: "bg-pink-100 group-hover:bg-pink-200", hover: "group-hover:border-pink-300" }
};

export default function DashboardCard({ href, title, subtitle, icon, color = "blue" }: DashboardCardProps) {
  const { bg, hover } = colorClasses[color] ?? colorClasses.blue;
  return (
    <Link href={href} className="group">
      <div
        className={`bg-white rounded-xl shadow-soft border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 ${hover}`}>
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center transition-colors`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
