import Link from "next/link";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";

export default function AdminHomePage() {
  return (
    <ProtectedAdminLayout title="Admin Dashboard" subtitle="Manage your KeyAway platform">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Analytics Card */}
        <Link href="/admin/analytics" className="group">
          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-blue-300">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Analytics
                </h3>
                <p className="text-sm text-gray-500">View user behavior and engagement metrics</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Programs Card */}
        <Link href="/admin/programs" className="group">
          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-green-300">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">🎮</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  Programs
                </h3>
                <p className="text-sm text-gray-500">Manage CD key programs and content</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Events Card */}
        <Link href="/admin/events" className="group">
          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-purple-300">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                  Events
                </h3>
                <p className="text-sm text-gray-500">Track and analyze user interactions</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Key Reports Card */}
        <Link href="/admin/key-reports" className="group">
          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-orange-300">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <span className="text-2xl">🔄</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  Key Reports
                </h3>
                <p className="text-sm text-gray-500">Manage all CD key reports (working, expired, limit reached)</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Settings Card */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 opacity-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
              <p className="text-sm text-gray-500">Coming soon - Platform configuration</p>
            </div>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 opacity-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Users</h3>
              <p className="text-sm text-gray-500">Coming soon - User management</p>
            </div>
          </div>
        </div>

        {/* Reports Card */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 opacity-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
              <p className="text-sm text-gray-500">Coming soon - Detailed reporting</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Total Events Today</p>
                <p className="text-gray-300 text-3xl font-bold">Loading...</p>
              </div>
              <span className="text-4xl opacity-50">📊</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Active Programs</p>
                <p className="text-gray-300 text-3xl font-bold">Loading...</p>
              </div>
              <span className="text-4xl opacity-50">🎮</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">Social Clicks</p>
                <p className="text-gray-300 text-3xl font-bold">Loading...</p>
              </div>
              <span className="text-4xl opacity-50">📱</span>
            </div>
          </div>
        </div>
      </div>
    </ProtectedAdminLayout>
  );
}
