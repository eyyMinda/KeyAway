"use client";

interface EventChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  title: string;
  type?: "bar" | "doughnut" | "line";
  className?: string;
}

const defaultColors = [
  "#3B82F6", // blue
  "#10B981", // green
  "#8B5CF6", // purple
  "#F59E0B", // orange
  "#EF4444", // red
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#F97316" // orange-500
];

export default function EventChart({ data, title, type = "doughnut", className = "" }: EventChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...data.map(item => item.value));

  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-soft border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>No data available</p>
        </div>
      </div>
    );
  }

  if (type === "doughnut") {
    return (
      <div className={`bg-white rounded-xl shadow-soft border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>

        <div className="flex items-center justify-center mb-6">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const cumulativePercentage = data
                  .slice(0, index)
                  .reduce((sum, prevItem) => sum + (prevItem.value / total) * 100, 0);

                const startAngle = (cumulativePercentage / 100) * 360;
                const endAngle = ((cumulativePercentage + percentage) / 100) * 360;

                const color = item.color || defaultColors[index % defaultColors.length];

                const radius = 40;
                const circumference = 2 * Math.PI * radius;
                const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((startAngle / 360) * circumference);

                return (
                  <circle
                    key={item.name}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 hover:stroke-width-10"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Events</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            const color = item.color || defaultColors[index % defaultColors.length];

            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{item.value.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "bar") {
    return (
      <div className={`bg-white rounded-xl shadow-soft border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>

        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const color = item.color || defaultColors[index % defaultColors.length];

            return (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.value.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
