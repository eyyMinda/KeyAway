interface DataTableProps {
  title: string;
  data: Array<{ key: string; value: number; label?: string }>;
  maxItems?: number;
  showPercentage?: boolean;
  className?: string;
}

export default function DataTable({
  title,
  data,
  maxItems = 10,
  showPercentage = false,
  className = ""
}: DataTableProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const sortedData = data.sort((a, b) => b.value - a.value).slice(0, maxItems);

  return (
    <div className={`bg-white rounded-xl shadow-soft border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {data.length} total items • {total.toLocaleString()} total events
        </p>
      </div>

      <div className="p-6">
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>No data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedData.map((item, index) => {
              const percentage = showPercentage ? (item.value / total) * 100 : 0;

              return (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                    <div className="flex-1 min-w-0 ml-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.label || item.key}</p>
                      {showPercentage && <p className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(item.value / sortedData[0].value) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
