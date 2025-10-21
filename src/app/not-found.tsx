import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-neutral-900 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-8xl font-bold text-primary-500 mb-4">404</div>
            <div className="absolute -top-2 -right-2 text-4xl animate-bounce">🔑</div>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto rounded-full"></div>
        </div>

        {/* Content */}
        <div className="bg-neutral-800 rounded-2xl shadow-soft p-8 mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-lg text-neutral-300 mb-6 leading-relaxed">
            Oops! It looks like this page has gone missing. The CD key you&apos;re looking for might have been claimed
            or moved.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go Home
            </Link>

            <Link
              href="/programs"
              className="inline-flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 text-neutral-200 font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-medium focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-neutral-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Browse Programs
            </Link>
          </div>
        </div>

        {/* Helpful Links */}
        <div className="text-center">
          <p className="text-neutral-400 text-sm mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/" className="text-primary-400 hover:text-primary-300 transition-colors">
              Popular Programs
            </Link>
            <span className="text-neutral-600">•</span>
            <Link href="/" className="text-primary-400 hover:text-primary-300 transition-colors">
              Latest Keys
            </Link>
            <span className="text-neutral-600">•</span>
            <Link href="/" className="text-primary-400 hover:text-primary-300 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
