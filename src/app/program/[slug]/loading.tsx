export default function Loading() {
  return (
    <main className="max-w-4xl w-full mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded mb-6 w-full"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>

        <div className="overflow-x-auto mt-6">
          <div className="w-full border border-gray-200">
            <div className="bg-gray-100 p-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="p-2 border-t">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
