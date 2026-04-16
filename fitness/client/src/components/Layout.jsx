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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-8">Fitness Planner</h1>
        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600'
                  : 'hover:bg-slate-800'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-700 pt-4 mt-4 space-y-2">
          <div className="px-4 text-sm text-slate-400">
            <div>Logged in as</div>
            <div className="text-white font-medium">{user?.name || 'User'}</div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full px-4 py-2 text-left text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm"
            >
              Log Out
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
