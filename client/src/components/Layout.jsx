import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard' },
  { path: '/schedule', label: 'Schedule' },
  { path: '/log', label: 'Log Workout' },
  { path: '/progress', label: 'Progress' },
  { path: '/settings', label: 'Settings' },
];

function NavIcon({ variant }) {
  const props = { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (variant === 'home') return <svg {...props} viewBox="0 0 24 24"><path d="M3 9.5L12 4l9 5.5M4 10v9a1 1 0 001 1h14a1 1 0 001-1v-9M9 21v-5a3 3 0 016 0v5" /></svg>;
  if (variant === 'calendar') return <svg {...props} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>;
  if (variant === 'activity') return <svg {...props} viewBox="0 0 24 24"><path d="M14.5 4l-5 6-3 5 6.5 6L20 10l-5.5-6zM4 20l4-4M9 15l3-3"/></svg>;
  if (variant === 'chart') return <svg {...props} viewBox="0 0 24 24"><path d="M3 18h4v4M9 14h4v8M15 8h4v14"/><path d="M3 3h18v18H3z" rx="1"/></svg>;
  if (variant === 'settings') return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>;
  return null;
}

export default function Layout({ user, onLogout, children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 bg-[#0f0f14] text-white flex flex-col fixed h-full z-10">
        <div className="px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14.5 4l-5 6-3 5 6.5 6L20 10l-5.5-6z"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">FitTrack</h1>
          </div>
        </div>

        <nav className="flex-1 px-3">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 font-medium text-sm transition-all ${
                  active
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <NavIcon variant={item.path === '/' ? 'home' : item.path === '/schedule' ? 'calendar' : item.path === '/log' ? 'activity' : item.path === '/progress' ? 'chart' : 'settings'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-4 mb-3">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Account</div>
            <div className="text-sm font-semibold text-white">{user?.name || 'User'}</div>
            <div className="text-xs text-slate-500 capitalize mt-0.5">{user?.goal || ''} · {user?.experience || ''}</div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 p-8 ml-60 overflow-auto min-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
