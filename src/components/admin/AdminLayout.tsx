import { ReactNode } from "react";
import AdminHeader from "./layout/AdminHeader";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** When provided, replaces the default title+subtitle header */
  headerContent?: ReactNode;
}

export default function AdminLayout({ children, title, subtitle, headerContent }: AdminLayoutProps) {
  const showHeader = headerContent ?? title;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader />

      {/* Main Content */}
      <main className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        {showHeader && (
          <div className="mb-6 sm:mb-8">
            {headerContent ?? (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
                {subtitle && <p className="mt-2 text-base sm:text-lg text-gray-600">{subtitle}</p>}
              </>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </main>
    </div>
  );
}
