import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/schedule', label: 'Schedule', icon: '📅' },
  { path: '/log', label: 'Log Workout', icon: '💪' },
  { path: '/progress', label: 'Progress', icon: '📈' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout({ user, onLogout, children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
        <div className="px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-sm font-bold">💪</div>
            <h1 className="text-lg font-bold tracking-tight">FitTrack</h1>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'nav-item-active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="px-3 mb-3">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Profile</div>
            <div className="text-sm font-semibold text-white">{user?.name || 'User'}</div>
            <div className="text-xs text-slate-500 mt-0.5">{user?.goal || ''} · {user?.experience || ''}</div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all text-sm"
            >
              <span>👋</span>
              <span>Log Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 ml-64 overflow-auto min-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
