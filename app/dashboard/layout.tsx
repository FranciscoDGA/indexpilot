import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Sidebar */}
      <aside className="hidden lg:block w-64 bg-slate-800 border-r border-slate-700 sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-700">
          <Link href="/dashboard" className="text-2xl font-bold text-white hover:text-blue-400">
            IndexPilot
          </Link>
          <p className="text-slate-400 text-sm mt-1">URL Indexing Platform</p>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/settings"
            className="block px-4 py-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            Settings
          </Link>
          <Link
            href="/dashboard/api"
            className="block px-4 py-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            API Keys
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-700 absolute bottom-0 w-full">
          <Link
            href="/profile"
            className="block px-4 py-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            Profile
          </Link>
          <Link
            href="/auth/logout"
            className="block px-4 py-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition mt-2"
          >
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
