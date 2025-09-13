export default function Loading() {
  return (
    <main className="min-h-screen bg-neutral-900">
      {/* Program Information Section Loading */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            {/* Hero Content */}
            <div className="text-center mb-12">
              <div className="h-16 bg-neutral-700 rounded-lg mb-4 mx-auto w-3/4"></div>
              <div className="h-6 bg-neutral-700 rounded mb-2 mx-auto w-1/2"></div>
              <div className="h-4 bg-neutral-700 rounded mx-auto w-1/3"></div>
            </div>

            {/* Program Image and Stats */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="aspect-video bg-neutral-700 rounded-xl"></div>
                <div className="flex gap-4">
                  <div className="h-8 bg-neutral-700 rounded-lg w-24"></div>
                  <div className="h-8 bg-neutral-700 rounded-lg w-24"></div>
                  <div className="h-8 bg-neutral-700 rounded-lg w-24"></div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="h-6 bg-neutral-700 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-700 rounded w-full"></div>
                <div className="h-4 bg-neutral-700 rounded w-5/6"></div>
                <div className="h-4 bg-neutral-700 rounded w-4/5"></div>
                <div className="h-12 bg-neutral-700 rounded-lg w-48"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CD Key Table Section Loading */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="text-center mb-8">
              <div className="h-8 bg-neutral-700 rounded-lg mb-4 mx-auto w-1/3"></div>
              <div className="h-4 bg-neutral-700 rounded mx-auto w-1/4"></div>
            </div>

            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 border-b border-neutral-700/50">
                <div className="h-6 bg-neutral-700 rounded w-1/4"></div>
              </div>

              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 bg-neutral-700/30 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-4 w-4 bg-neutral-600 rounded"></div>
                      <div className="h-4 bg-neutral-600 rounded w-48"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-8 bg-neutral-600 rounded w-16"></div>
                      <div className="h-8 bg-neutral-600 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Activation Instructions Section Loading */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="text-center mb-12">
              <div className="h-10 bg-neutral-700 rounded-lg mb-4 mx-auto w-1/2"></div>
              <div className="h-5 bg-neutral-700 rounded mx-auto w-1/3"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center">
                  <div className="h-16 w-16 bg-neutral-700 rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-neutral-700 rounded mb-2 w-3/4 mx-auto"></div>
                  <div className="h-4 bg-neutral-700 rounded mb-2 w-full"></div>
                  <div className="h-4 bg-neutral-700 rounded w-5/6 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Programs Section Loading */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="text-center mb-12">
              <div className="h-10 bg-neutral-700 rounded-lg mb-4 mx-auto w-1/3"></div>
              <div className="h-5 bg-neutral-700 rounded mx-auto w-1/4"></div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 overflow-hidden">
                  <div className="aspect-video bg-neutral-700"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-neutral-600 rounded w-3/4"></div>
                    <div className="h-4 bg-neutral-600 rounded w-full"></div>
                    <div className="h-4 bg-neutral-600 rounded w-2/3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-neutral-600 rounded w-16"></div>
                      <div className="h-8 bg-neutral-600 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comments Section Loading */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="text-center mb-8">
              <div className="h-8 bg-neutral-700 rounded-lg mb-4 mx-auto w-1/4"></div>
              <div className="h-4 bg-neutral-700 rounded mx-auto w-1/3"></div>
            </div>

            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/50 p-8">
              <div className="h-32 bg-neutral-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
