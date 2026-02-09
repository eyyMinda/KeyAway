interface AnalyticsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  color?: "blue" | "green" | "purple" | "orange" | "red";
}

const colorMap = {
  blue: { bg: "bg-blue-500/50", text: "text-blue-600", border: "border-blue-200" },
  green: { bg: "bg-green-500/50", text: "text-green-600", border: "border-green-200" },
  purple: { bg: "bg-purple-500/50", text: "text-purple-600", border: "border-purple-200" },
  orange: { bg: "bg-orange-500/50", text: "text-orange-600", border: "border-orange-200" },
  red: { bg: "bg-red-500/50", text: "text-red-600", border: "border-red-200" }
} as const;

export default function AnalyticsCard({ title, value, subtitle, trend, icon, color = "blue" }: AnalyticsCardProps) {
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="p-5 flex flex-col gap-4 flex-1 min-w-0">
        <div className={`grid gap-x-4 gap-y-1 items-start min-w-0 ${icon ? "grid-cols-[auto_1fr]" : "grid-cols-1"}`}>
          {icon && (
            <div
              className={`row-span-2 w-11 h-11 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center text-xl shrink-0`}
              aria-hidden>
              <span className={c.text}>{icon}</span>
            </div>
          )}
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-snug break-words min-w-0">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums min-w-0 leading-none">{value.toLocaleString()}</p>
        </div>

        {(subtitle || trend) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-2 border-t border-gray-100 text-xs text-gray-500">
            {subtitle && <span className="truncate">{subtitle}</span>}
            {trend && (
              <span>
                <span className={`font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
                <span className="text-gray-400 ml-1">vs last period</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
