export default function KeyStatusTooltip() {
  return (
    <div className="group relative">
      <button className="p-2 text-neutral-400 hover:text-neutral-200 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
      {/* Tooltip content */}
      <div className="absolute bottom-full right-0 mb-2 px-4 py-3 bg-neutral-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 w-80">
        <div className="space-y-2">
          <div className="font-semibold text-white mb-2">Key Status Guide:</div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
            <span>
              <strong>New:</strong> Fresh, unused keys
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-success-500 rounded-full"></span>
            <span>
              <strong>Active:</strong> Working and available
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-warning-500 rounded-full"></span>
            <span>
              <strong>Limit:</strong> Usage limit reached
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-error-500 rounded-full"></span>
            <span>
              <strong>Expired:</strong> Past validity date
            </span>
          </div>
          <div className="max-w-80 text-wrap mt-3 pt-2 border-t border-neutral-600 text-xs text-neutral-300">
            Keys automatically expire based on their validity dates. Report non-working keys to help improve the system.
          </div>
        </div>
        {/* Arrow */}
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800"></div>
      </div>
    </div>
  );
}
